import { isHiddenCanary } from '../../../catalogue/exercises/exercises.constants';
import { costEurMicros, countTokens } from '../../gateway/pricing';
import { advisoryClassB } from '../../judge/class-b';
import { chunkCorpus, type CorpusDoc } from './chunking';
import { citedChunkIds, isRefusal } from './grounded-generate';
import {
  answerableHidden,
  declaresGate,
  expandGoldSpan,
  EvalLedger,
  gateThreshold,
  goldSpanOverlap,
  mapLimited,
  publicGold,
  publicTraceItems,
  toTraceQuery,
} from './rag.shared';
import { titleBoost } from './rerank';
import { retrieveRanked, type RankedChunk } from './retrieve';
import type {
  HiddenItem,
  PublicItem,
  R3Payload,
  RagGradeResult,
  TraceQuery,
} from './rag.types';

const K = 5;
/** Parallel model calls per graded run; bookkeeping is serialised in the gateway. */
const GENERATION_CONCURRENCY = 4;
const DEFAULT_CITATION_FORMAT = 1;

/**
 * Produces the answer for one question. Graded runs and the lab use a real
 * model through the gateway; offline content checks pass a simulator. The
 * learner's generation prompt is the system message, verbatim.
 */
export type R3Generator = (input: {
  system: string;
  user: string;
  question: string;
  ranked: RankedChunk[];
}) => Promise<string>;

/** User turn sent to the model: the question plus the frozen top-5 context. */
export function r3UserMessage(
  question: string,
  context: { id: string; text: string }[],
): string {
  const lines = context.map((row) => `(id: ${row.id}) ${row.text}`);
  return `Question: ${question}\n\nRetrieved context:\n${lines.join('\n\n')}`;
}

export function r3Context(ranked: RankedChunk[]) {
  return ranked.map((row) => ({ id: row.chunk.id, text: row.chunk.text }));
}

const DEFAULT_OVERLAP = 0.85;
const DEFAULT_UNANSWERABLE_NEED = 5;
const DEFAULT_ANSWERABLE_REFUSE_MAX = 2;

export async function gradeR3(
  payload: R3Payload,
  docs: CorpusDoc[],
  hidden: HiddenItem[],
  publicItems: PublicItem[] = [],
  generate: R3Generator,
  gates?: unknown,
): Promise<RagGradeResult> {
  const formatTarget = gateThreshold(
    gates,
    'citation_format',
    DEFAULT_CITATION_FORMAT,
  );
  const overlapThreshold = gateThreshold(
    gates,
    'gold_span_overlap',
    DEFAULT_OVERLAP,
  );
  const unanswerableNeed = gateThreshold(
    gates,
    'unanswerable_refusals',
    DEFAULT_UNANSWERABLE_NEED,
  );
  const answerableRefuseMax = gateThreshold(
    gates,
    'answerable_refusals',
    DEFAULT_ANSWERABLE_REFUSE_MAX,
  );
  const chunks = chunkCorpus(docs, 400, 80, 'document');
  const usable = hidden.filter((item) => !isHiddenCanary(item.question));
  const answerable = answerableHidden(usable);
  const unanswerable = usable.filter((item) => !item.answerable);

  const misses: RagGradeResult['failingCases'] = [];
  const failingQueries: TraceQuery[] = [];
  let formatHits = 0;
  let fabricated = 0;
  let overlapSum = 0;
  let overlapCount = 0;
  let unanswerableRefusals = 0;
  let answerableRefusals = 0;

  let tokensIn = 0;
  let tokensOut = 0;
  const ledger = new EvalLedger();
  let modelCalls = 0;
  const generated = await mapLimited(
    usable,
    GENERATION_CONCURRENCY,
    async (item) => {
      const ranked = frozenRetrieve(item.question, chunks);
      if (refusedByScore(item.question, chunks, payload)) {
        // Weak retrieval: refuse without spending a model call.
        return { item, ranked, answer: SCORE_REFUSAL, skipped: true };
      }
      modelCalls += 1;
      const user = r3UserMessage(item.question, r3Context(ranked));
      const answer = await generate({
        system: payload.generationPrompt,
        user,
        question: item.question,
        ranked,
      });
      tokensIn += countTokens(`${payload.generationPrompt}\n${user}`);
      tokensOut += countTokens(answer);
      return { item, ranked, answer, skipped: false };
    },
  );

  for (const { item, ranked, answer, skipped } of generated) {
    const retrievedIds = new Set(ranked.map((row) => row.chunk.id));
    const citations = citedChunkIds(answer);
    const refused = isRefusal(answer);
    const formatOk =
      refused || citations.some((id) => /^[a-z0-9:-]+$/i.test(id));
    if (formatOk && (refused || citations.length > 0)) {
      formatHits += 1;
    }
    for (const id of citations) {
      if (!retrievedIds.has(id)) {
        fabricated += 1;
      }
    }

    if (item.answerable && item.goldSpan && item.goldDocId) {
      if (refused) {
        answerableRefusals += 1;
      }
      const gold = expandGoldSpan(docs, item.goldDocId, item.goldSpan);
      const overlap = Math.max(
        0,
        ...citations.map((id) => {
          const chunk = ranked.find((row) => row.chunk.id === id);
          return chunk ? goldSpanOverlap(chunk.chunk.text, gold) : 0;
        }),
      );
      if (!refused) {
        overlapSum += overlap;
        overlapCount += 1;
      }
      const grounded =
        !refused && overlap >= overlapThreshold && citations.length > 0;
      const cause = skipped
        ? 'refused-below-score-threshold'
        : refused
          ? 'over-refusal'
          : citations.length === 0
            ? 'no-citation'
            : 'citation-outside-gold-span';
      ledger.record(item, grounded, grounded ? null : { code: cause });
      if (!grounded && ledger.reveal(item)) {
        misses.push({
          question: item.question,
          goldSpan: gold,
          retrieved: ranked.map((row) => row.chunk.text.slice(0, 220)),
          answer: answer.slice(0, 400),
          note: cause,
        });
        failingQueries.push(
          toTraceQuery('failing_sample', item.question, ranked),
        );
      }
    } else if (!item.answerable) {
      ledger.record(item, refused, refused ? null : { code: 'under-refusal' });
    }
    if (!item.answerable && refused) {
      unanswerableRefusals += 1;
    } else if (!item.answerable && !refused && ledger.reveal(item)) {
      misses.push({
        question: item.question,
        retrieved: ranked.map((row) => row.chunk.text.slice(0, 220)),
        answer: answer.slice(0, 400),
        note: 'under-refusal',
      });
      failingQueries.push(
        toTraceQuery('failing_sample', item.question, ranked),
      );
    }
  }

  ledger.note('hallucinated-citation', fabricated);
  const formatRate = usable.length === 0 ? 0 : formatHits / usable.length;
  const meanOverlap = overlapCount === 0 ? 0 : overlapSum / overlapCount;
  const formatPass = formatRate >= formatTarget && fabricated === 0;
  const overlapPass = meanOverlap >= overlapThreshold;
  const underRefusePass = unanswerableRefusals >= unanswerableNeed;
  const overRefusePass = answerableRefusals <= answerableRefuseMax;
  const callsPerQuestion = usable.length === 0 ? 0 : modelCalls / usable.length;
  const callsGate = declaresGate(gates, 'model_calls_per_question');
  const callsCeiling = gateThreshold(gates, 'model_calls_per_question', 1);
  const callsPass = !callsGate || callsPerQuestion <= callsCeiling;
  const passed =
    formatPass && overlapPass && underRefusePass && overRefusePass && callsPass;

  return {
    verdict: passed ? 'pass' : 'fail',
    metrics: {
      citation_format: { value: formatRate, fabricated },
      gold_span_overlap: { value: meanOverlap },
      unanswerable_refusals: {
        value: unanswerableRefusals,
        total: unanswerable.length,
      },
      answerable_refusals: {
        value: answerableRefusals,
        total: answerable.length,
      },
      model_calls_per_question: { value: callsPerQuestion, calls: modelCalls },
    },
    gateResults: [
      {
        id: 'citation-format',
        class: 'A',
        metric: 'citation_format',
        op: 'gte',
        value: formatTarget,
        actual: formatRate,
        passed: formatPass,
      },
      {
        id: 'citation-grounded',
        class: 'A',
        metric: 'gold_span_overlap',
        op: 'gte',
        value: overlapThreshold,
        actual: meanOverlap,
        passed: overlapPass,
      },
      {
        id: 'refusal-unanswerable',
        class: 'A',
        metric: 'unanswerable_refusals',
        op: 'gte',
        value: unanswerableNeed,
        actual: unanswerableRefusals,
        passed: underRefusePass,
      },
      {
        id: 'refusal-answerable',
        class: 'A',
        metric: 'answerable_refusals',
        op: 'lte',
        value: answerableRefuseMax,
        actual: answerableRefusals,
        passed: overRefusePass,
      },
      ...(callsGate
        ? [
            {
              id: 'model-calls',
              class: 'A' as const,
              metric: 'model_calls_per_question',
              op: 'lte',
              value: callsCeiling,
              actual: callsPerQuestion,
              passed: callsPass,
            },
          ]
        : []),
      advisoryClassB('citation-supports-claim', 'citation_supports_claim'),
    ],
    failureClasses: passed
      ? []
      : [
          ...(callsPass ? [] : ['model-calls-over-budget']),
          ...r3FailureClasses({
            formatPass,
            fabricated,
            overlapPass,
            underRefusePass,
            overRefusePass,
          }).filter((code) => callsPass || code !== 'grounding'),
        ],
    scorecard: {
      goldSpanOverlap: meanOverlap,
      unanswerableRefusals: unanswerableRefusals,
      answerableRefusals: answerableRefusals,
      fabricatedCitations: fabricated,
      chunks: chunks.length,
      breakdown: ledger.breakdown(),
    },
    failingCases: misses,
    trace: {
      simulator: 'rag',
      payload,
      k: K,
      chunkCount: chunks.length,
      tokensIn,
      tokensOut,
      costEurMicros: costEurMicros(tokensIn, tokensOut),
      queries: [
        ...publicTraceItems(publicItems).map((item) =>
          toTraceQuery(
            'public',
            item.question,
            frozenRetrieve(item.question, chunks),
            {
              gold: publicGold(docs, item),
              firstStage: retrieveRanked(
                item.question,
                chunks,
                Math.min(chunks.length, 20),
              ),
            },
          ),
        ),
        ...failingQueries,
      ],
    },
  };
}

function r3FailureClasses(flags: {
  formatPass: boolean;
  fabricated: number;
  overlapPass: boolean;
  underRefusePass: boolean;
  overRefusePass: boolean;
}): string[] {
  const classes: string[] = [];
  if (!flags.formatPass) {
    classes.push('format-drift');
  }
  if (flags.fabricated > 0) {
    classes.push('hallucinated-citation');
  }
  if (!flags.overlapPass) {
    classes.push('citation-outside-gold-span');
  }
  if (!flags.underRefusePass) {
    classes.push('under-refusal');
  }
  if (!flags.overRefusePass) {
    classes.push('over-refusal');
  }
  return classes.length > 0 ? classes : ['grounding'];
}

/** What a skipped question answers: a refusal isRefusal() recognises. */
export const SCORE_REFUSAL =
  "I don't know: nothing retrieved scores high enough to answer from.";

/** Best first-stage BM25 score for the question (before the title boost). */
export function topRetrievalScore(
  question: string,
  chunks: ReturnType<typeof chunkCorpus>,
): number {
  return retrieveRanked(question, chunks, 1)[0]?.score ?? 0;
}

export function refusedByScore(
  question: string,
  chunks: ReturnType<typeof chunkCorpus>,
  payload: R3Payload,
): boolean {
  const threshold = payload.refuseBelowScore ?? 0;
  return threshold > 0 && topRetrievalScore(question, chunks) < threshold;
}

function frozenRetrieve(
  question: string,
  chunks: ReturnType<typeof chunkCorpus>,
) {
  const pool = retrieveRanked(question, chunks, Math.min(chunks.length, 20));
  return titleBoost(question, pool).slice(0, K);
}
