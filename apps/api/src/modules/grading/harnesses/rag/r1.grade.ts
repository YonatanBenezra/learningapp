import { countTokens } from '../../gateway/pricing';
import { chunkCorpus, type CorpusDoc } from './chunking';
import { holdsGold, retrieveRanked } from './retrieve';
import {
  answerableHidden,
  costEvidence,
  declaresGate,
  diagnoseRetrievalMiss,
  EvalLedger,
  goldOf,
  gateThreshold,
  publicGold,
  publicTraceItems,
  stageLog,
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
  // Every chunk is a vector someone stores and pays for. Overlap and tiny
  // chunks multiply them, so an exercise can cap the index size.
  const indexGate = declaresGate(gates, 'index_chunks');
  const indexCeiling = gateThreshold(
    gates,
    'index_chunks',
    Number.POSITIVE_INFINITY,
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
    const tokens = countTokens(
      ranked.map((row) => row.chunk.text).join('\n\n'),
    );
    contextTokenSum += tokens;
    perQuery.push({ tokens, chunks: ranked.length });
    const gold = goldOf(
      docs,
      item.goldDocId as string,
      item.goldSpan as string,
    );
    const hit = ranked.some((row) => holdsGold(row.chunk, gold));
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
        goldSpan: gold.text,
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
  const indexPass = !indexGate || chunks.length <= indexCeiling;
  const passed = recallPass && contextPass && indexPass;
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
  if (indexGate) {
    gateResults.push({
      id: 'index-chunks',
      class: 'A',
      metric: 'index_chunks',
      op: 'lte',
      value: indexCeiling,
      actual: chunks.length,
      passed: indexPass,
    });
  }

  return {
    verdict: passed ? 'pass' : 'fail',
    metrics: {
      recall_at_5: { value: recall, hits, total },
      mean_context_tokens: { value: meanContextTokens },
      index_chunks: { value: chunks.length },
    },
    gateResults,
    failureClasses: passed
      ? []
      : [
          ...(contextPass ? [] : ['context-over-budget']),
          ...(indexPass ? [] : ['index-over-budget']),
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
          const log = stageLog();
          const ranked = retrieveRanked(item.question, chunks, K);
          log.add({
            id: 'search',
            label: 'BM25',
            detail: `top ${ranked.length} of ${chunks.length} chunks`,
            rows: ranked,
          });
          return toTraceQuery('public', item.question, ranked, {
            stages: log.stages,
            gold: publicGold(docs, item),
            contextTokens: countTokens(
              ranked.map((row) => row.chunk.text).join('\n\n'),
            ),
          });
        }),
        ...failingQueries,
      ],
    },
  };
}
