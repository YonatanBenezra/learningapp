import { countTokens } from '../../gateway/pricing';
import { advisoryClassB } from '../../judge/class-b';
import { MetricsLibrary } from '../../metrics/metrics.library';
import { chunkCorpus, type Chunk, type CorpusDoc } from './chunking';
import { crossEncoderRerank, mmrRerank, titleBoost } from './rerank';
import { retrieveByTermCount, type RankedChunk } from './retrieve';
import {
  answerableHidden,
  diagnoseRetrievalMiss,
  EvalLedger,
  gateThreshold,
  mapLimited,
  publicGold,
  publicTraceItems,
  type StageSink,
  stageLog,
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
const REWRITE_CONCURRENCY = 4;
/** A search query is one line; cap the rewrite's output to keep calls cheap. */
export const REWRITE_MAX_TOKENS = 60;
const metrics = new MetricsLibrary();

/**
 * Rewrites one question into a search query. `instruction` is the learner's
 * rewrite prompt (sent as the system message); the question is the user
 * message. Graded runs call the live model; offline checks pass a stub.
 */
export type QueryRewriter = (
  instruction: string,
  question: string,
) => Promise<string>;

/** The model's first non-empty line, minus labels and quotes; the question if that is empty. */
export function cleanRewrite(output: string, question: string): string {
  const line =
    output
      .split('\n')
      .map((part) => part.trim())
      .find(Boolean) ?? '';
  const query = line
    .replace(/^(rewritten\s+query|search\s+query|query)\s*:\s*/i, '')
    .replace(/^["'`]+|["'`]+$/g, '')
    .trim()
    .slice(0, 300);
  return query || question;
}

/** Search query per question: rewritten when the payload sets a rewrite prompt. */
export async function rewriteQueries(
  payload: R4Payload,
  questions: string[],
  rewriter: QueryRewriter | undefined,
): Promise<Map<string, string>> {
  const instruction = payload.queryRewritePrompt.trim();
  const unique = [...new Set(questions)];
  if (!instruction) {
    return new Map(unique.map((question) => [question, question]));
  }
  if (!rewriter) {
    throw new Error('Query rewrite needs a model, and none is configured.');
  }
  const rewritten = await mapLimited(unique, REWRITE_CONCURRENCY, async (q) =>
    cleanRewrite(await rewriter(instruction, q), q),
  );
  return new Map(unique.map((question, index) => [question, rewritten[index]]));
}

export async function gradeR4(
  payload: R4Payload,
  docs: CorpusDoc[],
  hidden: HiddenItem[],
  publicItems: PublicItem[] = [],
  rewriter: QueryRewriter | undefined,
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
  const chunks = chunkCorpus(docs, FROZEN_CHUNK, FROZEN_OVERLAP, 'document');
  const answerable = answerableHidden(hidden);
  const shownPublic = publicTraceItems(publicItems);
  const searchQuery = await rewriteQueries(
    payload,
    [...answerable, ...shownPublic].map((item) => item.question),
    rewriter,
  );
  const callsPerQuestion = payload.queryRewritePrompt.trim() ? 1 : 0;
  const misses: RagGradeResult['failingCases'] = [];
  const failingQueries: TraceQuery[] = [];
  const improvements: number[] = [];
  const contextTokens: number[] = [];
  const ledger = new EvalLedger();
  const window = rerankWindow(chunks, payload);

  for (const item of answerable) {
    const question = item.question;
    const query = searchQuery.get(question) ?? question;
    const baseline = r4Baseline(question, chunks);
    const reranked = await rerankForR4(question, chunks, payload, query);
    const baseNdcg = ndcgForGold(baseline, item.goldDocId as string);
    const nextNdcg = ndcgForGold(reranked, item.goldDocId as string);
    improvements.push(nextNdcg - baseNdcg);
    contextTokens.push(
      countTokens(reranked.map((row) => row.chunk.text).join('\n\n')),
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
            gold: {
              docId: item.goldDocId as string,
              text: item.goldSpan as string,
            },
            fullRanking: retrieveByTermCount(query, chunks, chunks.length),
            k: K,
            pool: payload.reranker === 'none' ? null : window,
          }),
    );
    if (!goldInTop && ledger.reveal(item)) {
      misses.push({
        question: item.question,
        goldSpan: item.goldSpan ?? undefined,
        retrieved: reranked.map((row) => row.chunk.text.slice(0, 220)),
        ...(query !== question ? { note: `Searched for: ${query}` } : {}),
      });
      failingQueries.push({
        ...toTraceQuery('failing_sample', item.question, reranked),
        ...(query !== question ? { rewrittenQuery: query } : {}),
      });
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

  const publicQueries: TraceQuery[] = [];
  for (const item of shownPublic) {
    const query = searchQuery.get(item.question) ?? item.question;
    const log = stageLog();
    const reranked = await rerankForR4(
      item.question,
      chunks,
      payload,
      query,
      log.add,
    );
    publicQueries.push({
      ...toTraceQuery('public', item.question, reranked, {
        stages: log.stages,
        gold: publicGold(docs, item),
        firstStage: retrieveByTermCount(query, chunks, window),
        contextTokens: countTokens(
          reranked.map((row) => row.chunk.text).join('\n\n'),
        ),
      }),
      ...(query !== item.question ? { rewrittenQuery: query } : {}),
    });
  }

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
      queries: [...publicQueries, ...failingQueries],
    },
  };
}

/** Shown in the lab so learners know what the reranker starts from. */
export const R4_FIRST_STAGE_LABEL = 'First stage keyword count';

/** Whole-document chunks: R4 locks chunking so only ranking changes. */
export function chunkForR4(docs: CorpusDoc[]): Chunk[] {
  return chunkCorpus(docs, FROZEN_CHUNK, FROZEN_OVERLAP, 'document');
}

/**
 * The bar the learner must beat: the weak keyword count on the question as
 * asked, with no rewrite and no rerank (see retrieveByTermCount).
 */
export function r4Baseline(question: string, chunks: Chunk[]): RankedChunk[] {
  return retrieveByTermCount(question, chunks, K);
}

function rerankWindow(chunks: Chunk[], payload: R4Payload): number {
  return Math.min(chunks.length, Math.max(payload.rerankTopN, K));
}

/**
 * The learner's pipeline: the first stage searches with `searchQuery` (the
 * rewritten query, or the question itself), then the reranker reorders the
 * top rerankTopN candidates against the question as asked.
 */
export async function rerankForR4(
  question: string,
  chunks: Chunk[],
  payload: R4Payload,
  searchQuery: string = question,
  log?: StageSink,
): Promise<RankedChunk[]> {
  const pool = retrieveByTermCount(
    searchQuery,
    chunks,
    rerankWindow(chunks, payload),
  );
  log?.({
    id: 'search',
    label: 'Keyword count',
    detail: `${searchQuery === question ? 'the question' : 'the rewrite'}: top ${pool.length} candidates`,
    rows: pool,
  });
  let top: RankedChunk[];
  if (payload.reranker === 'title-boost') {
    top = titleBoost(question, pool).slice(0, K);
  } else if (payload.reranker === 'mmr') {
    top = mmrRerank(pool).slice(0, K);
  } else if (payload.reranker === 'cross-encoder') {
    top = (await crossEncoderRerank(question, pool)).slice(0, K);
  } else {
    top = pool.slice(0, K);
  }
  log?.({
    id: 'rerank',
    label:
      payload.reranker === 'none' ? 'No rerank' : capitalise(payload.reranker),
    detail: `top ${top.length} kept`,
    rows: top,
  });
  return top;
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
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
