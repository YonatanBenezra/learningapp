import { isHiddenCanary } from '../../../catalogue/exercises/exercises.constants';
import type { ModelGateway } from '../../gateway/model.gateway';
import { advisoryClassB } from '../../judge/class-b';
import { chunkCorpus, type CorpusDoc } from './chunking';
import {
  citedChunkIds,
  groundedGenerate,
  isRefusal,
} from './grounded-generate';
import {
  answerableHidden,
  expandGoldSpan,
  FAILING_SAMPLE_LIMIT,
  goldSpanOverlap,
  publicTraceItems,
  toTraceQuery,
} from './rag.shared';
import { titleBoost } from './rerank';
import { retrieveRanked } from './retrieve';
import type {
  HiddenItem,
  R3Payload,
  RagGradeResult,
  TraceQuery,
} from './rag.types';

const K = 5;
const OVERLAP_THRESHOLD = 0.85;
const UNANSWERABLE_NEED = 5;
const ANSWERABLE_REFUSE_MAX = 2;

export async function gradeR3(
  payload: R3Payload,
  docs: CorpusDoc[],
  hidden: HiddenItem[],
  publicItems: { question: string }[] = [],
  gateway: ModelGateway,
  runId: string,
): Promise<RagGradeResult> {
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

  for (const item of usable) {
    const ranked = frozenRetrieve(item.question, chunks);
    const retrievedIds = new Set(ranked.map((row) => row.chunk.id));
    await gateway.complete({
      runId,
      prompt: `${payload.generationPrompt}\n\nQuestion: ${item.question}\nContext:\n${ranked
        .map((row) => `[${row.chunk.id}] ${row.chunk.text}`)
        .join('\n')}`,
    });
    const answer = groundedGenerate(payload.generationPrompt, ranked);
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
      const grounded = !refused && overlap >= OVERLAP_THRESHOLD && citations.length > 0;
      if (!grounded && misses.length < FAILING_SAMPLE_LIMIT) {
        misses.push({
          question: item.question,
          goldSpan: gold,
          retrieved: ranked.map((row) => row.chunk.text.slice(0, 220)),
          note: refused ? 'over-refusal' : 'citation-outside-gold-span',
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
        note: 'under-refusal',
      });
      failingQueries.push(toTraceQuery('failing_sample', item.question, ranked));
    }
  }

  const formatRate = usable.length === 0 ? 0 : formatHits / usable.length;
  const meanOverlap = overlapCount === 0 ? 0 : overlapSum / overlapCount;
  const formatPass = formatRate === 1 && fabricated === 0;
  const overlapPass = meanOverlap >= OVERLAP_THRESHOLD;
  const underRefusePass = unanswerableRefusals >= UNANSWERABLE_NEED;
  const overRefusePass = answerableRefusals <= ANSWERABLE_REFUSE_MAX;
  const passed =
    formatPass && overlapPass && underRefusePass && overRefusePass;

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
        op: 'eq',
        value: 1,
        actual: formatPass ? 1 : formatRate,
        passed: formatPass,
      },
      {
        id: 'citation-grounded',
        class: 'A',
        metric: 'gold_span_overlap',
        op: 'gte',
        value: OVERLAP_THRESHOLD,
        actual: meanOverlap,
        passed: overlapPass,
      },
      {
        id: 'refusal-unanswerable',
        class: 'A',
        metric: 'unanswerable_refusals',
        op: 'gte',
        value: UNANSWERABLE_NEED,
        actual: unanswerableRefusals,
        passed: underRefusePass,
      },
      {
        id: 'refusal-answerable',
        class: 'A',
        metric: 'answerable_refusals',
        op: 'lte',
        value: ANSWERABLE_REFUSE_MAX,
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
      tokensIn: 0,
      tokensOut: 0,
      costEurMicros: 0,
      queries: [
        ...publicTraceItems(publicItems).map((item) =>
          toTraceQuery(
            'public',
            item.question,
            frozenRetrieve(item.question, chunks),
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
