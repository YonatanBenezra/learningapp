import { estimateTokens } from '../../gateway/pricing';
import type { ModelGateway } from '../../gateway/model.gateway';
import { advisoryClassB } from '../../judge/class-b';
import { MetricsLibrary } from '../../metrics/metrics.library';
import { chunkCorpus, type CorpusDoc } from './chunking';
import { mmrRerank, titleBoost } from './rerank';
import { retrieveByTermCount, type RankedChunk } from './retrieve';
import {
  answerableHidden,
  diagnoseRetrievalMiss,
  EvalLedger,
  gateThreshold,
  publicGold,
  publicTraceItems,
  toTraceQuery,
} from './rag.shared';
import type {
  HiddenItem,
  PublicItem,
  R4Payload,
  RagGradeResult,
  TraceQuery,
} from './rag.types';

const K = 5;
const DEFAULT_IMPROVEMENT = 0.15;
const DEFAULT_CONTEXT_CEILING = 3000;
const DEFAULT_CALLS_PER_Q = 2;
const FROZEN_CHUNK = 400;
const FROZEN_OVERLAP = 80;
const metrics = new MetricsLibrary();

export async function gradeR4(
  payload: R4Payload,
  docs: CorpusDoc[],
  hidden: HiddenItem[],
  publicItems: PublicItem[] = [],
  gateway: ModelGateway | undefined,
  runId: string,
  gates?: unknown,
): Promise<RagGradeResult> {
  const improvementTarget = gateThreshold(
    gates,
    'ndcg_improvement',
    DEFAULT_IMPROVEMENT,
  );
  const contextCeiling = gateThreshold(
    gates,
    'context_tokens',
    DEFAULT_CONTEXT_CEILING,
  );
  const callsCeiling = gateThreshold(
    gates,
    'model_calls_per_question',
    DEFAULT_CALLS_PER_Q,
  );
  const chunks = chunkCorpus(
    docs,
    FROZEN_CHUNK,
    FROZEN_OVERLAP,
    'heading-aware',
  );
  const answerable = answerableHidden(hidden);
  const rewrite = payload.queryRewritePrompt.trim();
  const callsPerQuestion = rewrite ? 1 : 0;
  const misses: RagGradeResult['failingCases'] = [];
  const failingQueries: TraceQuery[] = [];
  const improvements: number[] = [];
  const contextTokens: number[] = [];
  const ledger = new EvalLedger();
  const window = Math.min(chunks.length, Math.max(payload.rerankTopN, K));

  for (const item of answerable) {
    const question = item.question;
    if (rewrite && gateway) {
      await gateway.complete({
        runId,
        prompt: `${payload.queryRewritePrompt}\n\nQuery: ${item.question}`,
      });
    }
    const baseline = r4Baseline(question, chunks);
    const reranked = rerankForR4(question, chunks, payload);
    const baseNdcg = ndcgForGold(baseline, item.goldDocId as string);
    const nextNdcg = ndcgForGold(reranked, item.goldDocId as string);
    improvements.push(nextNdcg - baseNdcg);
    contextTokens.push(
      estimateTokens(reranked.map((row) => row.chunk.text).join('\n\n')),
    );
    const goldInTop = reranked.some(
      (row) => row.chunk.docId === item.goldDocId,
    );
    ledger.record(
      item,
      goldInTop,
      goldInTop
        ? null
        : diagnoseRetrievalMiss({
            chunks,
            gold: item.goldSpan as string,
            fullRanking: retrieveByTermCount(question, chunks, chunks.length),
            k: K,
            pool: payload.reranker === 'none' ? null : window,
          }),
    );
    if (!goldInTop && ledger.reveal(item)) {
      misses.push({
        question: item.question,
        goldSpan: item.goldSpan ?? undefined,
        retrieved: reranked.map((row) => row.chunk.text.slice(0, 220)),
      });
      failingQueries.push(
        toTraceQuery('failing_sample', item.question, reranked),
      );
    }
  }

  const meanImprovement =
    improvements.length === 0
      ? 0
      : improvements.reduce((sum, value) => sum + value, 0) /
        improvements.length;
  const meanContext =
    contextTokens.length === 0
      ? 0
      : contextTokens.reduce((sum, value) => sum + value, 0) /
        contextTokens.length;
  const ndcgPass = meanImprovement >= improvementTarget;
  const contextPass = meanContext <= contextCeiling;
  const callsPass = callsPerQuestion <= callsCeiling;
  const passed = ndcgPass && contextPass && callsPass;

  return {
    verdict: passed ? 'pass' : 'fail',
    metrics: {
      ndcg_improvement: { value: meanImprovement },
      context_tokens: { value: meanContext },
      model_calls_per_question: { value: callsPerQuestion },
    },
    gateResults: [
      {
        id: 'ndcg-improvement',
        class: 'A',
        metric: 'ndcg_improvement',
        op: 'gte',
        value: improvementTarget,
        actual: meanImprovement,
        passed: ndcgPass,
      },
      {
        id: 'context-tokens',
        class: 'A',
        metric: 'context_tokens',
        op: 'lte',
        value: contextCeiling,
        actual: meanContext,
        passed: contextPass,
      },
      {
        id: 'calls-per-question',
        class: 'A',
        metric: 'model_calls_per_question',
        op: 'lte',
        value: callsCeiling,
        actual: callsPerQuestion,
        passed: callsPass,
      },
      advisoryClassB('answer-correctness', 'answer_correctness'),
    ],
    failureClasses: passed
      ? []
      : [
          ...(contextPass ? [] : ['context-over-budget']),
          ...(callsPass ? [] : ['model-calls-over-budget']),
          ...(ndcgPass
            ? []
            : [...ledger.topCauses(), 'ndcg-gain-below-target']),
        ],
    scorecard: {
      ndcgImprovement: meanImprovement,
      contextTokens: meanContext,
      modelCallsPerQuestion: callsPerQuestion,
      reranker: payload.reranker,
      rerankTopN: payload.rerankTopN,
      chunks: chunks.length,
      breakdown: ledger.breakdown(),
    },
    failingCases: misses,
    trace: {
      simulator: 'rag',
      payload,
      k: K,
      chunkCount: chunks.length,
      tokensIn: Math.round(meanContext * answerable.length),
      tokensOut: 0,
      costEurMicros: 0,
      queries: [
        ...publicTraceItems(publicItems).map((item) => {
          const reranked = rerankForR4(item.question, chunks, payload);
          return toTraceQuery('public', item.question, reranked, {
            gold: publicGold(docs, item),
            firstStage: retrieveByTermCount(
              item.question,
              chunks,
              Math.min(chunks.length, Math.max(payload.rerankTopN, K)),
            ),
            contextTokens: estimateTokens(
              reranked.map((row) => row.chunk.text).join('\n\n'),
            ),
          });
        }),
        ...failingQueries,
      ],
    },
  };
}

/** Shown in the lab so learners know what the reranker starts from. */
export const R4_FIRST_STAGE_LABEL = 'First stage keyword count';

/** R4's first stage is a deliberately weak keyword count; see retrieveByTermCount. */
export function r4Baseline(
  question: string,
  chunks: ReturnType<typeof chunkCorpus>,
): RankedChunk[] {
  return retrieveByTermCount(question, chunks, K);
}

export function rerankForR4(
  question: string,
  chunks: ReturnType<typeof chunkCorpus>,
  payload: R4Payload,
): RankedChunk[] {
  const window = Math.min(chunks.length, Math.max(payload.rerankTopN, K));
  const pool = retrieveByTermCount(question, chunks, window);
  if (payload.reranker === 'title-boost') {
    return titleBoost(question, pool).slice(0, K);
  }
  if (payload.reranker === 'mmr') {
    return mmrRerank(pool).slice(0, K);
  }
  return pool.slice(0, K);
}

function ndcgForGold(ranked: RankedChunk[], goldDocId: string): number {
  const relevances = ranked
    .slice(0, K)
    .map((row) => (row.chunk.docId === goldDocId ? 1 : 0));
  if (!relevances.includes(1)) {
    return 0;
  }
  return metrics.ndcgAtK(relevances, K);
}
