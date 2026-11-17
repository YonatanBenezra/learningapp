import { isHiddenCanary } from '../../../catalogue/exercises/exercises.constants';
import { costEurMicros, estimateTokens } from '../../gateway/pricing';
import { advisoryClassB } from '../../judge/class-b';
import { chunkCorpus, type CorpusDoc } from './chunking';
import { citedChunkIds, isRefusal } from './grounded-generate';
import {
  answerableHidden,
  expandGoldSpan,
  FAILING_SAMPLE_LIMIT,
  gateThreshold,
  goldSpanOverlap,
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

async function mapLimited<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (next < items.length) {
        const index = next;
        next += 1;
        results[index] = await task(items[index]);
      }
    },
  );
  await Promise.all(workers);
  return results;
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
  const chunks = chunkCorpus(docs, 400, 80, 'heading-aware');
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
  const generated = await mapLimited(
    usable,
    GENERATION_CONCURRENCY,
    async (item) => {
      const ranked = frozenRetrieve(item.question, chunks);
      const user = r3UserMessage(item.question, r3Context(ranked));
      const answer = await generate({
        system: payload.generationPrompt,
        user,
        question: item.question,
        ranked,
      });
      tokensIn += estimateTokens(`${payload.generationPrompt}\n${user}`);
      tokensOut += estimateTokens(answer);
      return { item, ranked, answer };
    },
  );

  for (const { item, ranked, answer } of generated) {
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
      if (!grounded && misses.length < FAILING_SAMPLE_LIMIT) {
        misses.push({
          question: item.question,
          goldSpan: gold,
          retrieved: ranked.map((row) => row.chunk.text.slice(0, 220)),
          answer: answer.slice(0, 400),
          note: refused
            ? 'over-refusal'
            : citations.length === 0
              ? 'no-citation'
              : 'citation-outside-gold-span',
        });
        failingQueries.push(
          toTraceQuery('failing_sample', item.question, ranked),
        );
      }
    } else if (!item.answerable && refused) {
      unanswerableRefusals += 1;
    } else if (
      !item.answerable &&
      !refused &&
      misses.length < FAILING_SAMPLE_LIMIT
    ) {
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

  const formatRate = usable.length === 0 ? 0 : formatHits / usable.length;
  const meanOverlap = overlapCount === 0 ? 0 : overlapSum / overlapCount;
  const formatPass = formatRate >= formatTarget && fabricated === 0;
  const overlapPass = meanOverlap >= overlapThreshold;
  const underRefusePass = unanswerableRefusals >= unanswerableNeed;
  const overRefusePass = answerableRefusals <= answerableRefuseMax;
  const passed = formatPass && overlapPass && underRefusePass && overRefusePass;

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
      advisoryClassB('citation-supports-claim', 'citation_supports_claim'),
    ],
    failureClasses: passed
      ? []
      : r3FailureClasses({
          formatPass,
          fabricated,
          overlapPass,
          underRefusePass,
          overRefusePass,
        }),
    scorecard: {
      goldSpanOverlap: meanOverlap,
      unanswerableRefusals: unanswerableRefusals,
      answerableRefusals: answerableRefusals,
      fabricatedCitations: fabricated,
      chunks: chunks.length,
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

function frozenRetrieve(
  question: string,
  chunks: ReturnType<typeof chunkCorpus>,
) {
  const pool = retrieveRanked(question, chunks, Math.min(chunks.length, 20));
  return titleBoost(question, pool).slice(0, K);
}
