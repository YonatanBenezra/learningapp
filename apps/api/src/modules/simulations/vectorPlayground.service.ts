import { Types } from 'mongoose';
import { cosineSimilarity, cosineToScore, embedTexts } from '../ai-guidance/embedding.client';
import type { EmbeddingBatchResult } from '../ai-guidance/embedding.client';
import { SimulationSubmission } from './simulationSubmission.model';
import type { VectorPlaygroundRunResult, VectorPlaygroundSubmitResult } from './simulation.types';
import {
  DEFAULT_VECTOR_QUERY,
  VECTOR_PLAYGROUND_CHUNKS,
  lexicalOverlap,
  listVectorPlaygroundChunks,
} from './vectorPlayground.engine';

const chunkEmbeddingCache = new Map<string, number[]>();
let chunkEmbeddingMeta: {
  model: string;
  provider: EmbeddingBatchResult['provider'];
  dimensions: number;
} | null = null;

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

function chunkTexts() {
  return VECTOR_PLAYGROUND_CHUNKS.map((chunk) => `${chunk.source}\n${chunk.text}`);
}

function storeChunkVectors(vectors: number[][], batch: EmbeddingBatchResult) {
  VECTOR_PLAYGROUND_CHUNKS.forEach((chunk, index) => {
    chunkEmbeddingCache.set(chunk.id, vectors[index] ?? []);
  });
  chunkEmbeddingMeta = {
    model: batch.model,
    provider: batch.provider,
    dimensions: batch.dimensions || (vectors[0]?.length ?? 0),
  };
}

function cacheMatches(batch: EmbeddingBatchResult) {
  return (
    chunkEmbeddingCache.size === VECTOR_PLAYGROUND_CHUNKS.length &&
    chunkEmbeddingMeta !== null &&
    chunkEmbeddingMeta.model === batch.model &&
    chunkEmbeddingMeta.provider === batch.provider &&
    chunkEmbeddingMeta.dimensions === (batch.dimensions || (batch.vectors[0]?.length ?? 0))
  );
}

async function embedQueryAndIndex(query: string): Promise<{
  queryVector: number[];
  batch: EmbeddingBatchResult;
}> {
  if (chunkEmbeddingMeta && chunkEmbeddingCache.size === VECTOR_PLAYGROUND_CHUNKS.length) {
    const queryBatch = await embedTexts([query]);
    if (cacheMatches(queryBatch)) {
      return { queryVector: queryBatch.vectors[0] ?? [], batch: queryBatch };
    }
    chunkEmbeddingCache.clear();
    chunkEmbeddingMeta = null;
  }

  const batch = await embedTexts([query, ...chunkTexts()]);
  storeChunkVectors(batch.vectors.slice(1), batch);
  return { queryVector: batch.vectors[0] ?? [], batch };
}

export function getVectorPlaygroundBootstrap() {
  return {
    chunks: listVectorPlaygroundChunks(),
    defaultQuery: DEFAULT_VECTOR_QUERY,
    topKRange: { min: 1, max: 5, default: 3 },
    sampleQueries: [
      DEFAULT_VECTOR_QUERY,
      'What is cosine similarity used for in semantic search?',
      'How should I split long documents for embedding indexes?',
    ],
  };
}

export async function runVectorPlaygroundLive(
  query: string,
  topK = 3,
): Promise<VectorPlaygroundRunResult> {
  const started = Date.now();
  const { queryVector, batch } = await embedQueryAndIndex(query);

  const k = Math.min(5, Math.max(1, topK));
  const ranked = VECTOR_PLAYGROUND_CHUNKS.map((chunk) => {
    const chunkVector = chunkEmbeddingCache.get(chunk.id) ?? [];
    const similarity = cosineSimilarity(queryVector, chunkVector);
    const lexical = lexicalOverlap(query, `${chunk.source} ${chunk.text}`);
    return {
      id: chunk.id,
      source: chunk.source,
      text: chunk.text,
      score: cosineToScore(similarity),
      cosine: roundCosine(similarity),
      lexicalScore: lexical.score,
      lexicalTerms: lexical.terms,
      similarity,
    };
  }).sort((a, b) => b.similarity - a.similarity);

  const index = ranked.map(({ similarity: _similarity, ...match }, position) => ({
    ...match,
    rank: position + 1,
    retrieved: position < k,
  }));
  const matches = index.filter((match) => match.retrieved);
  const lexicalTop = [...index].sort((a, b) => b.lexicalScore - a.lexicalScore || b.cosine - a.cosine)[0];

  const hints: string[] = [];
  if (matches[0]?.score < 45) {
    hints.push('Try more specific words from the scenario, such as "hallucination" or "grounding".');
  }
  if (matches.length > 1 && matches[0].cosine - matches[1].cosine < 0.08) {
    hints.push('Top matches are close — read chunk text, not just the score.');
  }
  if (lexicalTop && matches[0] && lexicalTop.id !== matches[0].id) {
    hints.push(
      `Lexical overlap ranks "${lexicalTop.source}" first, but cosine ranks "${matches[0].source}". Embeddings capture meaning, not just shared words.`,
    );
  }

  return {
    matches,
    index,
    hints,
    defaultQuery: DEFAULT_VECTOR_QUERY,
    embeddingModel: batch.model,
    embeddingProvider: batch.provider,
    embeddingDimensions: batch.dimensions || (batch.vectors[0]?.length ?? 0),
    embeddingFallback: batch.fallback,
    embeddingWarning: embeddingWarning(batch),
    latencyMs: Date.now() - started,
    topK: k,
    topMatchId: ranked[0]?.id,
  };
}

export async function submitVectorPlaygroundLive(input: {
  simulationSlug: string;
  query: string;
  selectedChunkId: string;
  topK?: number;
  userId?: string | null;
  guestSessionId?: string | null;
}): Promise<VectorPlaygroundSubmitResult> {
  const run = await runVectorPlaygroundLive(input.query, input.topK ?? 3);
  const index = run.index ?? run.matches;
  const top = index[0];
  const selected = index.find((row) => row.id === input.selectedChunkId) ?? null;
  const topMatchId = top?.id ?? run.topMatchId ?? '';
  const passed = Boolean(selected && selected.id === topMatchId);
  const selectedCosine = selected?.cosine ?? 0;
  const topCosine = top?.cosine ?? 0;
  const selectedRank = selected?.rank ?? 0;
  const score = selected ? selected.score : 0;

  const topChunk = VECTOR_PLAYGROUND_CHUNKS.find((chunk) => chunk.id === topMatchId);
  const selectedChunk = VECTOR_PLAYGROUND_CHUNKS.find((chunk) => chunk.id === input.selectedChunkId);
  const feedback = passed
    ? `Correct pick. "${topChunk?.source ?? topMatchId}" had the highest cosine (${topCosine.toFixed(3)}) for this query.`
    : `Not the top match. You picked "${selectedChunk?.source ?? input.selectedChunkId}" (cos ${selectedCosine.toFixed(3)}, rank ${selectedRank || '—'}). Highest cosine was "${topChunk?.source ?? topMatchId}" (${topCosine.toFixed(3)}).`;

  const submission = await SimulationSubmission.create({
    simulationSlug: input.simulationSlug,
    kind: 'vector_playground',
    userId: input.userId ? new Types.ObjectId(input.userId) : null,
    guestSessionId: input.guestSessionId?.trim() || null,
    prompt: input.query,
    modelOutput: JSON.stringify(
      {
        query: input.query,
        topK: run.topK,
        selectedChunkId: input.selectedChunkId,
        topMatchId,
        matches: run.matches,
        embeddingModel: run.embeddingModel,
        embeddingProvider: run.embeddingProvider,
        embeddingDimensions: run.embeddingDimensions,
        latencyMs: run.latencyMs,
        selectedCosine,
        topCosine,
        selectedRank,
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
      { topMatchId, selectedChunkId: input.selectedChunkId, selectedCosine, topCosine, selectedRank, matches: run.matches },
      null,
      2,
    ),
    submissionId: String(submission._id),
    topMatchId,
    selectedChunkId: input.selectedChunkId,
    selectedCosine,
    topCosine,
    selectedRank,
  };
}

/** Test helper — clears cached chunk embeddings between cases. */
export function resetVectorPlaygroundCache(): void {
  chunkEmbeddingCache.clear();
  chunkEmbeddingMeta = null;
}
