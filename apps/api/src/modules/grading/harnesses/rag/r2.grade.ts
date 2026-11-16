import { estimateTokens } from '../../gateway/pricing';
import { advisoryClassB } from '../../judge/class-b';
import { chunkCorpus, type Chunk, type CorpusDoc } from './chunking';
import { titleBoost } from './rerank';
import {
  chunkContainsSpan,
  retrieveRanked,
  type RankedChunk,
} from './retrieve';
import {
  answerableHidden,
  expandGoldSpan,
  FAILING_SAMPLE_LIMIT,
  gateThreshold,
  publicGold,
  publicTraceItems,
  toTraceQuery,
} from './rag.shared';
import type {
  HiddenItem,
  PublicItem,
  R2Payload,
  RagGradeResult,
  TraceQuery,
} from './rag.types';

const DEFAULT_RECALL = 0.8;
const DEFAULT_TOKEN_CEILING = 2000;

/**
 * R2 learners pick chunk size, top-k and rerank; the split itself is fixed.
 * Sentence packing keeps sentences whole, so a chunk either carries the gold
 * sentence or it does not, and the chunk text is exactly what enters context.
 */
export const R2_SPLIT = { overlap: 0, splitStrategy: 'sentence' as const };

export function chunkForR2(docs: CorpusDoc[], payload: R2Payload): Chunk[] {
  return chunkCorpus(
    docs,
    payload.chunkSize,
    R2_SPLIT.overlap,
    R2_SPLIT.splitStrategy,
  );
}

export function gradeR2(
  payload: R2Payload,
  docs: CorpusDoc[],
  hidden: HiddenItem[],
  publicItems: PublicItem[] = [],
  gates?: unknown,
): RagGradeResult {
  const recallThreshold = gateThreshold(gates, 'recall@k', DEFAULT_RECALL);
  const tokenCeiling = gateThreshold(
    gates,
    'mean_prompt_tokens',
    DEFAULT_TOKEN_CEILING,
  );
  const chunks = chunkForR2(docs, payload);
  const answerable = answerableHidden(hidden);
  const misses: RagGradeResult['failingCases'] = [];
  const failingQueries: TraceQuery[] = [];
  let hits = 0;
  const tokenCounts: number[] = [];

  for (const item of answerable) {
    const ranked = retrieveForR2(item.question, chunks, payload);
    // Recall is judged on exactly the text that is sent as context.
    const packed = ranked.map((row) => row.chunk.text).join('\n\n');
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
      failingQueries.push(
        toTraceQuery('failing_sample', item.question, ranked),
      );
    }
  }

  const total = answerable.length;
  const recall = total === 0 ? 0 : hits / total;
  const meanTokens =
    tokenCounts.length === 0
      ? 0
      : tokenCounts.reduce((sum, value) => sum + value, 0) / tokenCounts.length;
  const recallPass = recall >= recallThreshold;
  const costPass = meanTokens <= tokenCeiling;
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
        value: recallThreshold,
        actual: recall,
        passed: recallPass,
      },
      {
        id: 'mean-prompt-tokens',
        class: 'A',
        metric: 'mean_prompt_tokens',
        op: 'lte',
        value: tokenCeiling,
        actual: meanTokens,
        passed: costPass,
      },
      advisoryClassB('answer-correctness', 'answer_correctness'),
    ],
    failureClasses: passed
      ? []
      : r2FailureClasses(payload, recallPass, costPass),
    scorecard: {
      recallAtK: recall,
      meanPromptTokens: meanTokens,
      tokenCeiling: tokenCeiling,
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
        ...publicTraceItems(publicItems).map((item) => {
          const ranked = retrieveForR2(item.question, chunks, payload);
          return toTraceQuery('public', item.question, ranked, {
            gold: publicGold(docs, item),
            firstStage: payload.rerank
              ? retrieveRanked(
                  item.question,
                  chunks,
                  rerankPool(payload, chunks),
                )
              : null,
            contextTokens: estimateTokens(
              `Context:\n${ranked.map((row) => row.chunk.text).join('\n\n')}`,
            ),
          });
        }),
        ...failingQueries,
      ],
    },
  };
}

/** Candidates fetched before the title boost when rerank is on. */
function rerankPool(payload: R2Payload, chunks: Chunk[]): number {
  return Math.min(chunks.length, Math.max(payload.topK * 4, payload.topK));
}

export function retrieveForR2(
  question: string,
  chunks: Chunk[],
  payload: R2Payload,
): RankedChunk[] {
  const pool = payload.rerank ? rerankPool(payload, chunks) : payload.topK;
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
  if (!costPass && payload.chunkSize >= 400) {
    classes.push('chunks-too-large');
  }
  if (!recallPass && !payload.rerank && payload.topK <= 8) {
    classes.push('no-rerank-with-low-k');
  }
  if (!recallPass) {
    classes.push('quality-sacrificed');
  }
  return classes.length > 0 ? classes : ['cost-engineering'];
}
