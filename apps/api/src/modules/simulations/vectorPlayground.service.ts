import { Types } from 'mongoose';
import { cosineSimilarity, cosineToScore, embedTexts } from '../ai-guidance/embedding.client';
import { SimulationSubmission } from './simulationSubmission.model';
import type { VectorPlaygroundRunResult, VectorPlaygroundSubmitResult } from './simulation.types';
import {
  DEFAULT_VECTOR_QUERY,
  VECTOR_PLAYGROUND_CHUNKS,
  listVectorPlaygroundChunks,
} from './vectorPlayground.engine';

const chunkEmbeddingCache = new Map<string, number[]>();
let embeddingModelUsed = 'openai/text-embedding-3-small';

async function ensureChunkEmbeddings(): Promise<void> {
  if (chunkEmbeddingCache.size === VECTOR_PLAYGROUND_CHUNKS.length) return;

  const missing = VECTOR_PLAYGROUND_CHUNKS.filter((chunk) => !chunkEmbeddingCache.has(chunk.id));
  if (missing.length === 0) return;

  const batch = await embedTexts(missing.map((chunk) => `${chunk.source}\n${chunk.text}`));
  embeddingModelUsed = batch.model;
  missing.forEach((chunk, index) => {
    chunkEmbeddingCache.set(chunk.id, batch.vectors[index] ?? []);
  });
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
  await ensureChunkEmbeddings();
  const queryBatch = await embedTexts([query]);
  const queryVector = queryBatch.vectors[0] ?? [];
  embeddingModelUsed = queryBatch.model;

  const k = Math.min(5, Math.max(1, topK));
  const ranked = VECTOR_PLAYGROUND_CHUNKS.map((chunk) => {
    const chunkVector = chunkEmbeddingCache.get(chunk.id) ?? [];
    const similarity = cosineSimilarity(queryVector, chunkVector);
    return {
      id: chunk.id,
      source: chunk.source,
      text: chunk.text,
      score: cosineToScore(similarity),
      similarity,
    };
  })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);

  const hints: string[] = [];
  if (ranked[0]?.score < 45) {
    hints.push('Try more specific words from the scenario, such as "hallucination" or "grounding".');
  }
  if (ranked.length > 1 && ranked[0].similarity - ranked[1].similarity < 0.08) {
    hints.push('Top matches are close — read chunk text, not just the score.');
  }

  return {
    matches: ranked.map(({ similarity: _similarity, ...match }) => match),
    hints,
    defaultQuery: DEFAULT_VECTOR_QUERY,
    embeddingModel: embeddingModelUsed,
    embeddingProvider: queryBatch.provider,
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
  const topMatchId = run.topMatchId ?? run.matches[0]?.id ?? '';
  const passed = input.selectedChunkId === topMatchId;
  const topScore = run.matches[0]?.score ?? 0;
  const score = passed ? Math.max(topScore, 85) : Math.max(20, topScore - 18);

  const topChunk = VECTOR_PLAYGROUND_CHUNKS.find((chunk) => chunk.id === topMatchId);
  const feedback = passed
    ? `Correct pick. "${topChunk?.source ?? topMatchId}" had the highest cosine similarity for this query.`
    : `Not the top match. Highest similarity was "${topChunk?.source ?? topMatchId}" — compare grounding language vs generic RAG text.`;

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
    output: JSON.stringify({ topMatchId, selectedChunkId: input.selectedChunkId, matches: run.matches }, null, 2),
    submissionId: String(submission._id),
    topMatchId,
    selectedChunkId: input.selectedChunkId,
  };
}

/** Test helper — clears cached chunk embeddings between cases. */
export function resetVectorPlaygroundCache(): void {
  chunkEmbeddingCache.clear();
}
