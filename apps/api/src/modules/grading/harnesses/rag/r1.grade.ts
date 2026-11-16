import { estimateTokens } from '../../gateway/pricing';
import { chunkCorpus, type CorpusDoc } from './chunking';
import { chunkContainsSpan, retrieveRanked } from './retrieve';
import {
  answerableHidden,
  declaresGate,
  expandGoldSpan,
  FAILING_SAMPLE_LIMIT,
  gateThreshold,
  publicTraceItems,
  toTraceQuery,
} from './rag.shared';
import type {
  GateResult,
  HiddenItem,
  RagGradeResult,
  RagPayload,
  TraceQuery,
} from './rag.types';

export const R1_K = 5;
const K = R1_K;
const DEFAULT_RECALL = 0.8;
const DEFAULT_CONTEXT_TOKENS = 500;

export function gradeR1(
  payload: RagPayload,
  docs: CorpusDoc[],
  hidden: HiddenItem[],
  publicItems: { question: string }[] = [],
  gates?: unknown,
): RagGradeResult {
  const recallThreshold = gateThreshold(gates, 'recall@5', DEFAULT_RECALL);
  // Chunk size only trades off against something when context has a cost, so
  // exercises can declare a context-token budget for the top-k chunks.
  const contextGate = declaresGate(gates, 'mean_context_tokens');
  const contextCeiling = gateThreshold(
    gates,
    'mean_context_tokens',
    DEFAULT_CONTEXT_TOKENS,
  );
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
  let contextTokenSum = 0;
  for (const item of answerable) {
    const ranked = retrieveRanked(item.question, chunks, K);
    contextTokenSum += estimateTokens(
      ranked.map((row) => row.chunk.text).join('\n\n'),
    );
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
      failingQueries.push(
        toTraceQuery('failing_sample', item.question, ranked),
      );
    }
  }

  const total = answerable.length;
  const recall = total === 0 ? 0 : hits / total;
  const meanContextTokens = total === 0 ? 0 : contextTokenSum / total;
  const recallPass = recall >= recallThreshold;
  const contextPass = !contextGate || meanContextTokens <= contextCeiling;
  const passed = recallPass && contextPass;

  const gateResults: GateResult[] = [
    {
      id: 'recall-at-5',
      class: 'A',
      metric: 'recall@5',
      op: 'gte',
      value: recallThreshold,
      actual: recall,
      passed: recallPass,
    },
  ];
  if (contextGate) {
    gateResults.push({
      id: 'mean-context-tokens',
      class: 'A',
      metric: 'mean_context_tokens',
      op: 'lte',
      value: contextCeiling,
      actual: meanContextTokens,
      passed: contextPass,
    });
  }

  return {
    verdict: passed ? 'pass' : 'fail',
    metrics: {
      recall_at_5: { value: recall, hits, total },
      mean_context_tokens: { value: meanContextTokens },
    },
    gateResults,
    failureClasses: passed
      ? []
      : r1FailureClasses(payload, recallPass, contextPass),
    scorecard: {
      recallAt5: recall,
      threshold: recallThreshold,
      meanContextTokens,
      chunks: chunks.length,
    },
    failingCases: misses,
    trace: {
      simulator: 'rag',
      payload,
      k: K,
      chunkCount: chunks.length,
      tokensIn: Math.round(contextTokenSum),
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

function r1FailureClasses(
  payload: RagPayload,
  recallPass: boolean,
  contextPass: boolean,
): string[] {
  const classes: string[] = [];
  if (!contextPass) {
    classes.push('context-over-budget');
  }
  if (payload.chunkSize <= 80) {
    classes.push('chunk-too-small');
  }
  if (payload.chunkSize >= 900 || (!contextPass && recallPass)) {
    classes.push('chunk-too-large');
  }
  if (!recallPass) {
    if (payload.overlap === 0 && payload.splitStrategy !== 'heading-aware') {
      classes.push('no-overlap-boundary-loss');
    }
    if (payload.splitStrategy === 'fixed') {
      classes.push('structure-ignored');
    }
  }
  return classes.length > 0 ? [...new Set(classes)] : ['retrieval-quality'];
}
