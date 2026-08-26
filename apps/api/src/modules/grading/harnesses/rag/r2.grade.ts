import { estimateTokens } from '../../gateway/pricing';
import { advisoryClassB } from '../../judge/class-b';
import { chunkCorpus, type CorpusDoc } from './chunking';
import { titleBoost } from './rerank';
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
  R2Payload,
  RagGradeResult,
  TraceQuery,
} from './rag.types';

const RECALL_THRESHOLD = 0.8;
const TOKEN_CEILING = 2000;
const OVERLAP = 80;

export function gradeR2(
  payload: R2Payload,
  docs: CorpusDoc[],
  hidden: HiddenItem[],
  publicItems: { question: string }[] = [],
): RagGradeResult {
  const chunks = chunkCorpus(
    docs,
    payload.chunkSize,
    OVERLAP,
    'heading-aware',
  );
  const answerable = answerableHidden(hidden);
  const misses: RagGradeResult['failingCases'] = [];
  const failingQueries: TraceQuery[] = [];
  let hits = 0;
  const tokenCounts: number[] = [];

  for (const item of answerable) {
    const ranked = retrieveForR2(item.question, chunks, payload);
    const packed = ranked
      .map((row) => row.chunk.text.slice(0, payload.chunkSize))
      .join('\n\n');
    tokenCounts.push(estimateTokens(`Context:\n${packed}`));
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
  const meanTokens =
    tokenCounts.length === 0
      ? 0
      : tokenCounts.reduce((sum, value) => sum + value, 0) / tokenCounts.length;
  const recallPass = recall >= RECALL_THRESHOLD;
  const costPass = meanTokens <= TOKEN_CEILING;
  const passed = recallPass && costPass;

  return {
    verdict: passed ? 'pass' : 'fail',
    metrics: {
      recall_at_k: { value: recall, hits, total },
      mean_prompt_tokens: { value: meanTokens },
    },
    gateResults: [
      {
        id: 'recall-at-k',
        class: 'A',
        metric: 'recall@k',
        op: 'gte',
        value: RECALL_THRESHOLD,
        actual: recall,
        passed: recallPass,
      },
      {
        id: 'mean-prompt-tokens',
        class: 'A',
        metric: 'mean_prompt_tokens',
        op: 'lte',
        value: TOKEN_CEILING,
        actual: meanTokens,
        passed: costPass,
      },
      advisoryClassB('answer-correctness', 'answer_correctness'),
    ],
    failureClasses: passed ? [] : r2FailureClasses(payload, recallPass, costPass),
    scorecard: {
      recallAtK: recall,
      meanPromptTokens: meanTokens,
      tokenCeiling: TOKEN_CEILING,
      topK: payload.topK,
      rerank: payload.rerank,
      chunks: chunks.length,
    },
    failingCases: misses,
    trace: {
      simulator: 'rag',
      payload,
      k: payload.topK,
      chunkCount: chunks.length,
      tokensIn: Math.round(meanTokens * total),
      tokensOut: 0,
      costEurMicros: 0,
      queries: [
        ...publicTraceItems(publicItems).map((item) =>
          toTraceQuery(
            'public',
            item.question,
            retrieveForR2(item.question, chunks, payload),
          ),
        ),
        ...failingQueries,
      ],
    },
  };
}

function retrieveForR2(
  question: string,
  chunks: ReturnType<typeof chunkCorpus>,
  payload: R2Payload,
) {
  const pool = payload.rerank
    ? Math.min(chunks.length, Math.max(payload.topK * 4, payload.topK))
    : payload.topK;
  const ranked = retrieveRanked(question, chunks, pool);
  if (!payload.rerank) {
    return ranked.slice(0, payload.topK);
  }
  return titleBoost(question, ranked).slice(0, payload.topK);
}

function r2FailureClasses(
  payload: R2Payload,
  recallPass: boolean,
  costPass: boolean,
): string[] {
  const classes: string[] = [];
  if (!costPass && payload.topK >= 16) {
    classes.push('topk-too-high');
  }
  if (!recallPass && !payload.rerank && payload.topK <= 8) {
    classes.push('no-rerank-with-low-k');
  }
  if (!recallPass) {
    classes.push('quality-sacrificed');
  }
  return classes.length > 0 ? classes : ['cost-engineering'];
}
