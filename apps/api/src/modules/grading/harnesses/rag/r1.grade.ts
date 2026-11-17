import { estimateTokens } from '../../gateway/pricing';
import { chunkCorpus, type CorpusDoc } from './chunking';
import { chunkContainsSpan, retrieveRanked } from './retrieve';
import {
  answerableHidden,
  costEvidence,
  declaresGate,
  diagnoseRetrievalMiss,
  EvalLedger,
  expandGoldSpan,
  gateThreshold,
  publicGold,
  publicTraceItems,
  toTraceQuery,
} from './rag.shared';
import type {
  GateResult,
  HiddenItem,
  PublicItem,
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
  publicItems: PublicItem[] = [],
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
  const ledger = new EvalLedger();
  const perQuery: { tokens: number; chunks: number }[] = [];
  let hits = 0;
  let contextTokenSum = 0;
  for (const item of answerable) {
    const ranked = retrieveRanked(item.question, chunks, K);
    const tokens = estimateTokens(
      ranked.map((row) => row.chunk.text).join('\n\n'),
    );
    contextTokenSum += tokens;
    perQuery.push({ tokens, chunks: ranked.length });
    const gold = expandGoldSpan(
      docs,
      item.goldDocId as string,
      item.goldSpan as string,
    );
    const hit = ranked.some((row) => chunkContainsSpan(row.chunk.text, gold));
    ledger.record(
      item,
      hit,
      hit
        ? null
        : diagnoseRetrievalMiss({
            chunks,
            gold,
            fullRanking: retrieveRanked(item.question, chunks, chunks.length),
            k: K,
            pool: null,
          }),
    );
    if (hit) {
      hits += 1;
    } else if (ledger.reveal(item)) {
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
  if (contextGate) {
    ledger.setCost(costEvidence(perQuery, contextCeiling));
  }

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
      : [
          ...(contextPass ? [] : ['context-over-budget']),
          ...(recallPass ? [] : ledger.topCauses()),
        ],
    scorecard: {
      recallAt5: recall,
      threshold: recallThreshold,
      meanContextTokens,
      chunks: chunks.length,
      breakdown: ledger.breakdown(),
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
        ...publicTraceItems(publicItems).map((item) => {
          const ranked = retrieveRanked(item.question, chunks, K);
          return toTraceQuery('public', item.question, ranked, {
            gold: publicGold(docs, item),
            contextTokens: estimateTokens(
              ranked.map((row) => row.chunk.text).join('\n\n'),
            ),
          });
        }),
        ...failingQueries,
      ],
    },
  };
}
