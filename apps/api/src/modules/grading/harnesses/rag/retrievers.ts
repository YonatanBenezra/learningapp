import type { Chunk } from './chunking';
import { cosine, embedPassages, embedQueries } from './models/embedder';
import { stableScore } from './models/model-runtime';
import { retrieveRanked, type RankedChunk } from './retrieve';
import type { R2Payload, RetrievalMode } from './rag.types';

/**
 * First-stage retrieval modes:
 * - bm25: keyword match (Okapi BM25). Wins on exact terms, ids and numbers.
 * - dense: cosine similarity of embeddings (pinned bge-small). Wins on
 *   reworded questions that share few words with the answer.
 * - hybrid: both, min-max normalised per question and mixed by alpha
 *   (0 = pure BM25, 1 = pure dense).
 */
export type { RetrievalMode };

export const RETRIEVAL_MODES: RetrievalMode[] = ['bm25', 'dense', 'hybrid'];

export type RetrieverSpec = {
  mode: RetrievalMode;
  /** Hybrid only: weight on the dense score. */
  alpha: number;
};

export const BM25_RETRIEVER: RetrieverSpec = { mode: 'bm25', alpha: 0 };

const DEFAULT_HYBRID_ALPHA = 0.5;

/** The retriever an R2-style payload asks for (BM25 unless it says otherwise). */
export function retrieverSpecOf(payload: R2Payload): RetrieverSpec {
  const mode = payload.retrievalMode ?? 'bm25';
  return {
    mode,
    alpha:
      mode === 'dense'
        ? 1
        : mode === 'hybrid'
          ? (payload.hybridAlpha ?? DEFAULT_HYBRID_ALPHA)
          : 0,
  };
}

/** A ranker over one chunk set. `rank` is synchronous once prepared. */
export type Retriever = {
  spec: RetrieverSpec;
  chunks: Chunk[];
  /** Top k chunks for a question; dense modes need the question prepared. */
  rank(question: string, k: number): RankedChunk[];
};

export function bm25Retriever(chunks: Chunk[]): Retriever {
  return {
    spec: BM25_RETRIEVER,
    chunks,
    rank: (question, k) => retrieveRanked(question, chunks, k),
  };
}

/**
 * Builds a retriever and embeds what it needs up front: every chunk, and each
 * question it will be asked. BM25 needs nothing, so it never loads a model.
 */
export async function prepareRetriever(
  chunks: Chunk[],
  spec: RetrieverSpec,
  questions: string[],
): Promise<Retriever> {
  if (spec.mode === 'bm25') {
    return bm25Retriever(chunks);
  }
  const unique = [...new Set(questions)];
  const [chunkVectors, queryVectors] = await Promise.all([
    embedPassages(chunks.map((chunk) => chunk.text)),
    embedQueries(unique),
  ]);
  const queryVector = new Map(
    unique.map((question, index) => [question, queryVectors[index]]),
  );
  const alpha = Math.min(1, Math.max(0, spec.alpha));

  return {
    spec: { mode: spec.mode, alpha },
    chunks,
    rank(question, k) {
      const vector = queryVector.get(question);
      if (!vector) {
        throw new Error(`question was not prepared for ${spec.mode} retrieval`);
      }
      const dense = chunkVectors.map((chunkVector) =>
        cosine(vector, chunkVector),
      );
      let scores = dense;
      if (spec.mode === 'hybrid') {
        const lexical = new Map(
          retrieveRanked(question, chunks, chunks.length).map((row) => [
            row.chunk.id,
            row.score,
          ]),
        );
        const bm25 = minMax(chunks.map((chunk) => lexical.get(chunk.id) ?? 0));
        const semantic = minMax(dense);
        scores = chunks.map(
          (_, index) => alpha * semantic[index] + (1 - alpha) * bm25[index],
        );
      }
      return sortRanked(
        chunks.map((chunk, index) => ({
          chunk,
          score: stableScore(scores[index]),
        })),
      ).slice(0, k);
    },
  };
}

function minMax(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return max === min
    ? values.map(() => 0)
    : values.map((value) => (value - min) / (max - min));
}

export function sortRanked(ranked: RankedChunk[]): RankedChunk[] {
  return [...ranked].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.chunk.id.localeCompare(b.chunk.id);
  });
}

/** Display label for traces and the lab. */
export function retrieverLabel(spec: RetrieverSpec): string {
  if (spec.mode === 'dense') {
    return 'Dense (bge-small cosine)';
  }
  if (spec.mode === 'hybrid') {
    return `Hybrid (alpha ${spec.alpha.toFixed(2)})`;
  }
  return 'BM25';
}
