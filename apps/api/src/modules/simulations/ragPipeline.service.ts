import { Types } from 'mongoose';
import { cosineSimilarity, cosineToScore, embedTexts } from '../ai-guidance/embedding.client';
import type { EmbeddingBatchResult } from '../ai-guidance/embedding.client';
import { SimulationSubmission } from './simulationSubmission.model';
import type {
  RagChunkSize,
  RagPipelineRunResult,
  RagPipelineSubmitResult,
} from './simulation.types';
import {
  DEFAULT_RAG_QUERY,
  buildHints,
  chunkDocument,
  evaluateGrounding,
  getRagPipelineBootstrap,
  lexicalOverlap,
  mockAnswer,
  rerankBlend,
  sourceDocument,
  type RagChunk,
} from './ragPipeline.engine';

const chunkEmbeddingCache = new Map<string, Map<string, number[]>>();
const chunkEmbeddingMeta = new Map<
  string,
  {
    model: string;
    provider: EmbeddingBatchResult['provider'];
    dimensions: number;
  }
>();

function roundCosine(value: number) {
  return Math.round(value * 10000) / 10000;
}

function embeddingWarning(batch: EmbeddingBatchResult): string | undefined {
  if (batch.fallback) {
    const detail = batch.fallbackMessage?.trim();
    return detail
      ? `Live embeddings failed (${detail}). Ranked with local hash vectors.`
      : 'Live embeddings failed. Ranked with local hash vectors.';
  }
  if (batch.fallbackReason === 'no_api_key') {
    return 'Local embeddings — live provider is not configured.';
  }
  return undefined;
}

function cacheKey(chunkSize: RagChunkSize) {
  return chunkSize;
}

function cacheMatches(chunkSize: RagChunkSize, batch: EmbeddingBatchResult, chunkCount: number) {
  const cache = chunkEmbeddingCache.get(cacheKey(chunkSize));
  const meta = chunkEmbeddingMeta.get(cacheKey(chunkSize));
  return (
    Boolean(cache && cache.size === chunkCount && meta) &&
    meta?.model === batch.model &&
    meta?.provider === batch.provider &&
    meta?.dimensions === (batch.dimensions || (batch.vectors[0]?.length ?? 0))
  );
}

function storeChunkVectors(chunkSize: RagChunkSize, chunks: RagChunk[], vectors: number[][], batch: EmbeddingBatchResult) {
  const cache = new Map<string, number[]>();
  chunks.forEach((chunk, index) => {
    cache.set(chunk.id, vectors[index] ?? []);
  });
  chunkEmbeddingCache.set(cacheKey(chunkSize), cache);
  chunkEmbeddingMeta.set(cacheKey(chunkSize), {
    model: batch.model,
    provider: batch.provider,
    dimensions: batch.dimensions || (vectors[0]?.length ?? 0),
  });
}

async function embedQueryAndChunks(query: string, chunkSize: RagChunkSize, chunks: RagChunk[]) {
  const cached = chunkEmbeddingCache.get(cacheKey(chunkSize));
  const meta = chunkEmbeddingMeta.get(cacheKey(chunkSize));
  if (cached && meta && cached.size === chunks.length) {
    const queryBatch = await embedTexts([query]);
    if (cacheMatches(chunkSize, queryBatch, chunks.length)) {
      return { queryVector: queryBatch.vectors[0] ?? [], batch: queryBatch };
    }
    chunkEmbeddingCache.delete(cacheKey(chunkSize));
    chunkEmbeddingMeta.delete(cacheKey(chunkSize));
  }

  const batch = await embedTexts([query, ...chunks.map((chunk) => chunk.text)]);
  storeChunkVectors(chunkSize, chunks, batch.vectors.slice(1), batch);
  return { queryVector: batch.vectors[0] ?? [], batch };
}

export { getRagPipelineBootstrap, sourceDocument };

export async function runRagPipelineLive(
  query: string,
  chunkSize: RagChunkSize = 'medium',
  topK = 1,
  rerank = false,
): Promise<RagPipelineRunResult> {
  const started = Date.now();
  const chunks = chunkDocument(chunkSize);
  const k = Math.min(chunks.length, Math.max(1, topK));
  const { queryVector, batch } = await embedQueryAndChunks(query, chunkSize, chunks);
  const cache = chunkEmbeddingCache.get(cacheKey(chunkSize)) ?? new Map<string, number[]>();

  const scored = chunks.map((chunk) => {
    const similarity = cosineSimilarity(queryVector, cache.get(chunk.id) ?? []);
    const lexical = lexicalOverlap(query, chunk.text);
    return {
      chunk,
      cosine: roundCosine(similarity),
      lexicalScore: lexical.score,
      lexicalTerms: lexical.terms,
      rerankScore: roundCosine(rerankBlend(similarity, lexical.score, chunk.text)),
    };
  });

  const cosineOrder = [...scored].sort((a, b) => b.cosine - a.cosine || b.lexicalScore - a.lexicalScore);
  const cosineRankById = new Map(cosineOrder.map((row, index) => [row.chunk.id, index + 1]));
  const ranked = rerank
    ? [...scored].sort((a, b) => b.rerankScore - a.rerankScore || b.cosine - a.cosine)
    : cosineOrder;

  const publicChunks = ranked.map((row, index) => ({
    id: row.chunk.id,
    text: row.chunk.text,
    sectionIds: row.chunk.sectionIds,
    gold: row.chunk.gold,
    conflict: row.chunk.conflict,
    cosine: row.cosine,
    lexicalScore: row.lexicalScore,
    lexicalTerms: row.lexicalTerms,
    rank: index + 1,
    retrieved: index < k,
    cosineRank: cosineRankById.get(row.chunk.id) ?? index + 1,
    rerankScore: row.rerankScore,
    score: cosineToScore(row.cosine),
  }));

  const retrieved = publicChunks.filter((chunk) => chunk.retrieved);
  const grounding = evaluateGrounding(retrieved);
  const goldRow = publicChunks.find((chunk) => chunk.gold) ?? null;
  const rerankMoved = Boolean(
    rerank && goldRow && goldRow.cosineRank !== goldRow.rank && goldRow.rank === 1,
  );

  const hints = buildHints({
    chunkSize,
    topK: k,
    rerank,
    grounded: grounding.grounded,
    goldInContext: grounding.goldInContext,
    contextConflict: grounding.contextConflict,
    goldRank: goldRow?.rank ?? null,
    cosineTopId: cosineOrder[0]?.chunk.id,
    rerankMoved,
  });

  return {
    config: { chunkSize, topK: k, rerank },
    query,
    chunks: publicChunks,
    retrievedContext: retrieved.map((chunk) => chunk.text).join('\n\n'),
    answer: mockAnswer(
      retrieved.map((chunk) => ({
        id: chunk.id,
        text: chunk.text,
        sectionIds: chunk.sectionIds,
        gold: chunk.gold,
        conflict: chunk.conflict,
      })),
      grounding.grounded,
    ),
    grounded: grounding.grounded,
    goldInContext: grounding.goldInContext,
    contextConflict: grounding.contextConflict,
    goldRank: goldRow?.rank ?? null,
    goldCosine: goldRow?.cosine ?? null,
    evidencePrecision: grounding.evidencePrecision,
    hints,
    defaultQuery: DEFAULT_RAG_QUERY,
    embeddingModel: batch.model,
    embeddingProvider: batch.provider,
    embeddingDimensions: batch.dimensions || (batch.vectors[0]?.length ?? 0),
    embeddingFallback: batch.fallback,
    embeddingWarning: embeddingWarning(batch),
    latencyMs: Date.now() - started,
  };
}

export async function submitRagPipelineLive(input: {
  simulationSlug: string;
  query: string;
  chunkSize: RagChunkSize;
  topK: number;
  rerank: boolean;
  userId?: string | null;
  guestSessionId?: string | null;
}): Promise<RagPipelineSubmitResult> {
  const run = await runRagPipelineLive(input.query, input.chunkSize, input.topK, input.rerank);
  const passed = run.grounded;
  const score = passed
    ? cosineToScore(run.goldCosine ?? 0)
    : run.goldInContext
      ? run.evidencePrecision
      : 0;

  const feedback = passed
    ? `Grounded. The software exception ranked #${run.goldRank} (cos ${(run.goldCosine ?? 0).toFixed(3)}) and context did not include the 30-day paraphrase.`
    : run.config.chunkSize === 'large'
      ? 'Full-document chunking mixed the 30-day window with the exception, so the mock model over-generalized.'
      : !run.goldInContext
        ? `The exception never entered context (gold rank ${run.goldRank ?? '—'}, cos ${(run.goldCosine ?? 0).toFixed(3)}). Retrieve it first, then keep top-k tight.`
        : 'The exception was retrieved, but conflicting 30-day policy also landed in the context window.';

  const submission = await SimulationSubmission.create({
    simulationSlug: input.simulationSlug,
    kind: 'rag_pipeline',
    userId: input.userId ? new Types.ObjectId(input.userId) : null,
    guestSessionId: input.guestSessionId?.trim() || null,
    prompt: input.query,
    modelOutput: JSON.stringify(
      {
        query: input.query,
        config: run.config,
        grounded: run.grounded,
        goldInContext: run.goldInContext,
        goldRank: run.goldRank,
        goldCosine: run.goldCosine,
        evidencePrecision: run.evidencePrecision,
        answer: run.answer,
        embeddingModel: run.embeddingModel,
        embeddingProvider: run.embeddingProvider,
        latencyMs: run.latencyMs,
      },
      null,
      2,
    ),
    modelId: run.embeddingModel ?? null,
    score,
    passed,
    feedback,
    rubricBreakdown: [],
    status: 'graded',
    gradedAt: new Date(),
  });

  return {
    passed,
    score,
    feedback,
    output: JSON.stringify(
      {
        answer: run.answer,
        grounded: run.grounded,
        goldInContext: run.goldInContext,
        goldRank: run.goldRank,
        goldCosine: run.goldCosine,
        evidencePrecision: run.evidencePrecision,
        config: run.config,
        retrievedContext: run.retrievedContext,
      },
      null,
      2,
    ),
    submissionId: String(submission._id),
    grounded: run.grounded,
    goldInContext: run.goldInContext,
    goldRank: run.goldRank,
    goldCosine: run.goldCosine,
    evidencePrecision: run.evidencePrecision,
  };
}

export function resetRagPipelineCache(): void {
  chunkEmbeddingCache.clear();
  chunkEmbeddingMeta.clear();
}
