import { estimateTokens } from '../../gateway/pricing';
import type { ModelGateway } from '../../gateway/model.gateway';
import { advisoryClassB } from '../../judge/class-b';
import { MetricsLibrary } from '../../metrics/metrics.library';
import { chunkCorpus, type CorpusDoc } from './chunking';
import { mmrRerank, titleBoost } from './rerank';
import { retrieveRanked, type RankedChunk } from './retrieve';
import {
  answerableHidden,
  FAILING_SAMPLE_LIMIT,
  publicTraceItems,
  toTraceQuery,
} from './rag.shared';
import type {
  HiddenItem,
  R4Payload,
  RagGradeResult,
  TraceQuery,
} from './rag.types';

const K = 5;
const IMPROVEMENT = 0.15;
const CONTEXT_CEILING = 3000;
const CALLS_PER_Q = 2;
const FROZEN_CHUNK = 400;
const FROZEN_OVERLAP = 80;
const metrics = new MetricsLibrary();

export async function gradeR4(
  payload: R4Payload,
  docs: CorpusDoc[],
  hidden: HiddenItem[],
  publicItems: { question: string }[] = [],
  gateway: ModelGateway | undefined,
  runId: string,
): Promise<RagGradeResult> {
  const chunks = chunkCorpus(docs, FROZEN_CHUNK, FROZEN_OVERLAP, 'heading-aware');
  const answerable = answerableHidden(hidden);
  const rewrite = payload.queryRewritePrompt.trim();
  const callsPerQuestion = rewrite ? 1 : 0;
  const misses: RagGradeResult['failingCases'] = [];
  const failingQueries: TraceQuery[] = [];
  const improvements: number[] = [];
  const contextTokens: number[] = [];

  for (const item of answerable) {
    const question = item.question;
    if (rewrite && gateway) {
      await gateway.complete({
        runId,
        prompt: `${payload.queryRewritePrompt}\n\nQuery: ${item.question}`,
      });
    }
    const baseline = retrieveRanked(question, chunks, K);
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
    if (!goldInTop && misses.length < FAILING_SAMPLE_LIMIT) {
      misses.push({
        question: item.question,
        goldSpan: item.goldSpan ?? undefined,
        retrieved: reranked.map((row) => row.chunk.text.slice(0, 220)),
      });
      failingQueries.push(toTraceQuery('failing_sample', item.question, reranked));
    }
  }

  const meanImprovement =
    improvements.length === 0
      ? 0
      : improvements.reduce((sum, value) => sum + value, 0) / improvements.length;
  const meanContext =
    contextTokens.length === 0
      ? 0
      : contextTokens.reduce((sum, value) => sum + value, 0) /
        contextTokens.length;
  const ndcgPass = meanImprovement >= IMPROVEMENT;
  const contextPass = meanContext <= CONTEXT_CEILING;
  const callsPass = callsPerQuestion <= CALLS_PER_Q;
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
        value: IMPROVEMENT,
        actual: meanImprovement,
        passed: ndcgPass,
      },
      {
        id: 'context-tokens',
        class: 'A',
        metric: 'context_tokens',
        op: 'lte',
        value: CONTEXT_CEILING,
        actual: meanContext,
        passed: contextPass,
      },
      {
        id: 'calls-per-question',
        class: 'A',
        metric: 'model_calls_per_question',
        op: 'lte',
        value: CALLS_PER_Q,
        actual: callsPerQuestion,
        passed: callsPass,
      },
      advisoryClassB('answer-correctness', 'answer_correctness'),
    ],
    failureClasses: passed
      ? []
      : r4FailureClasses(payload, ndcgPass, contextPass),
    scorecard: {
      ndcgImprovement: meanImprovement,
      contextTokens: meanContext,
      modelCallsPerQuestion: callsPerQuestion,
      reranker: payload.reranker,
      rerankTopN: payload.rerankTopN,
      chunks: chunks.length,
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
        ...publicTraceItems(publicItems).map((item) =>
          toTraceQuery(
            'public',
            item.question,
            rerankForR4(item.question, chunks, payload),
          ),
        ),
        ...failingQueries,
      ],
    },
  };
}

function rerankForR4(
  question: string,
  chunks: ReturnType<typeof chunkCorpus>,
  payload: R4Payload,
): RankedChunk[] {
  const window = Math.min(chunks.length, Math.max(payload.rerankTopN, K));
  const pool = retrieveRanked(question, chunks, window);
  if (payload.reranker === 'title-boost') {
    return titleBoost(question, pool).slice(0, K);
  }
  if (payload.reranker === 'mmr') {
    return mmrRerank(pool).slice(0, K);
  }
  return pool.slice(0, K);
}

function ndcgForGold(ranked: RankedChunk[], goldDocId: string): number {
  const relevances = ranked.slice(0, K).map((row) =>
    row.chunk.docId === goldDocId ? 1 : 0,
  );
  if (!relevances.includes(1)) {
    return 0;
  }
  return metrics.ndcgAtK(relevances, K);
}

function r4FailureClasses(
  payload: R4Payload,
  ndcgPass: boolean,
  contextPass: boolean,
): string[] {
  const classes: string[] = [];
  if (!ndcgPass && payload.reranker === 'none') {
    classes.push('no-rerank');
  }
  if (!ndcgPass && payload.rerankTopN <= 8) {
    classes.push('rerank-window-too-narrow');
  }
  if (!contextPass) {
    classes.push('context-budget-blown');
  }
  if (payload.queryRewritePrompt.trim() && !ndcgPass) {
    classes.push('query-rewrite-drift');
  }
  return classes.length > 0 ? classes : ['reranking'];
}
