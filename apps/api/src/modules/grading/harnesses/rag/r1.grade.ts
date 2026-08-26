import { chunkCorpus, type CorpusDoc } from './chunking';
import { chunkContainsSpan, retrieveRanked } from './retrieve';
import {
  answerableHidden,
  expandGoldSpan,
  FAILING_SAMPLE_LIMIT,
  publicTraceItems,
  toTraceQuery,
} from './rag.shared';
import type {
  HiddenItem,
  RagGradeResult,
  RagPayload,
  TraceQuery,
} from './rag.types';

const K = 5;
const THRESHOLD = 0.8;

export function gradeR1(
  payload: RagPayload,
  docs: CorpusDoc[],
  hidden: HiddenItem[],
  publicItems: { question: string }[] = [],
): RagGradeResult {
  const chunks = chunkCorpus(
    docs,
    payload.chunkSize,
    payload.overlap,
    payload.splitStrategy,
  );
  const answerable = answerableHidden(hidden);

  const misses: RagGradeResult['failingCases'] = [];
  const failingQueries: TraceQuery[] = [];
  let hits = 0;
  for (const item of answerable) {
    const ranked = retrieveRanked(item.question, chunks, K);
    const gold = expandGoldSpan(
      docs,
      item.goldDocId as string,
      item.goldSpan as string,
    );
    const hit = ranked.some((row) => chunkContainsSpan(row.chunk.text, gold));
    if (hit) {
      hits += 1;
    } else if (misses.length < FAILING_SAMPLE_LIMIT) {
      misses.push({
        question: item.question,
        goldSpan: gold,
        retrieved: ranked.map((row) => row.chunk.text.slice(0, 220)),
      });
      failingQueries.push(toTraceQuery('failing_sample', item.question, ranked));
    }
  }

  const total = answerable.length;
  const recall = total === 0 ? 0 : hits / total;
  const passed = recall >= THRESHOLD;

  return {
    verdict: passed ? 'pass' : 'fail',
    metrics: {
      recall_at_5: { value: recall, hits, total },
    },
    gateResults: [
      {
        id: 'recall-at-5',
        class: 'A',
        metric: 'recall@5',
        op: 'gte',
        value: THRESHOLD,
        actual: recall,
        passed,
      },
    ],
    failureClasses: passed ? [] : r1FailureClasses(payload),
    scorecard: {
      recallAt5: recall,
      threshold: THRESHOLD,
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
            retrieveRanked(item.question, chunks, K),
          ),
        ),
        ...failingQueries,
      ],
    },
  };
}

function r1FailureClasses(payload: RagPayload): string[] {
  const classes: string[] = [];
  if (payload.chunkSize <= 80) {
    classes.push('chunk-too-small');
  }
  if (payload.chunkSize >= 900) {
    classes.push('chunk-too-large');
  }
  if (payload.overlap === 0 && payload.splitStrategy !== 'heading-aware') {
    classes.push('no-overlap-boundary-loss');
  }
  if (payload.splitStrategy === 'fixed') {
    classes.push('structure-ignored');
  }
  return classes.length > 0 ? classes : ['retrieval-quality'];
}
