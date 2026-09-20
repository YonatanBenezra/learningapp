import { estimateTokens } from '../../gateway/pricing';
import {
  isRagR1Slug,
  isRagR2Slug,
  isRagR3Slug,
  isRagR4Slug,
  isSandboxRagSlug,
} from '../../../catalogue/exercises/exercises.constants';
import { chunkCorpus, type Chunk, type CorpusDoc } from './chunking';
import {
  citedChunkIds,
  groundedGenerate,
  isRefusal,
} from './grounded-generate';
import {
  parseR1Payload,
  parseR2Payload,
  parseR3Payload,
  parseR4Payload,
} from './rag.payloads';
import type { R2Payload, R4Payload } from './rag.types';
import { mmrRerank, titleBoost } from './rerank';
import { retrieveRanked, type RankedChunk } from './retrieve';

export type RagLabArchetype = 'r1' | 'r2' | 'r3' | 'r4' | 'sandbox' | 'unknown';

export type RagLabFrozen = {
  label: string;
  items: string[];
};

export type RagLabHit = {
  chunkId: string;
  docId: string;
  title: string;
  score: number;
  text: string;
};

export type RagLabPreview = {
  archetype: RagLabArchetype;
  chunkCount: number;
  chunks: Chunk[];
  retrieved: RagLabHit[];
  baseline: RagLabHit[] | null;
  generation: string | null;
  citations: string[];
  refused: boolean;
  contextTokens: number;
  frozen: RagLabFrozen | null;
};

const K = 5;
const R3_FROZEN = {
  chunkSize: 400,
  overlap: 80,
  splitStrategy: 'heading-aware' as const,
};
const R2_FROZEN = {
  overlap: 80,
  splitStrategy: 'heading-aware' as const,
};

export function ragLabArchetype(slug: string): RagLabArchetype {
  if (isSandboxRagSlug(slug)) {
    return 'sandbox';
  }
  if (isRagR1Slug(slug)) {
    return 'r1';
  }
  if (isRagR2Slug(slug)) {
    return 'r2';
  }
  if (isRagR3Slug(slug)) {
    return 'r3';
  }
  if (isRagR4Slug(slug)) {
    return 'r4';
  }
  return 'unknown';
}

export function ragLabFrozen(slug: string): RagLabFrozen | null {
  const archetype = ragLabArchetype(slug);
  if (archetype === 'r3') {
    return {
      label: 'Retrieval locked',
      items: [
        `Chunk size ${R3_FROZEN.chunkSize}`,
        `Overlap ${R3_FROZEN.overlap}`,
        `Strategy ${R3_FROZEN.splitStrategy}`,
        `Top k ${K}`,
      ],
    };
  }
  if (archetype === 'r4') {
    return {
      label: 'Chunking locked',
      items: [
        `Chunk size ${R3_FROZEN.chunkSize}`,
        `Overlap ${R3_FROZEN.overlap}`,
        `Strategy ${R3_FROZEN.splitStrategy}`,
      ],
    };
  }
  if (archetype === 'r2') {
    return {
      label: 'Split locked',
      items: [
        `Strategy ${R2_FROZEN.splitStrategy}`,
        `Overlap ${R2_FROZEN.overlap}`,
      ],
    };
  }
  return null;
}

export function previewRagLabWithCorpus(
  slug: string,
  payload: unknown,
  question: string,
  docs: CorpusDoc[],
): RagLabPreview {
  const archetype = ragLabArchetype(slug);
  if (archetype === 'sandbox') {
    throw new Error('Sandbox exercises use the Python editor lab');
  }

  let chunks: Chunk[];
  let retrieved: RankedChunk[];
  let baseline: RankedChunk[] | null = null;
  let generation: string | null = null;
  let citations: string[] = [];
  let refused = false;

  if (archetype === 'r1' || archetype === 'unknown') {
    const parsed = parseR1Payload(payload);
    chunks = chunkCorpus(
      docs,
      parsed.chunkSize,
      parsed.overlap,
      parsed.splitStrategy,
    );
    retrieved = retrieveRanked(question, chunks, K);
  } else if (archetype === 'r2') {
    const parsed = parseR2Payload(payload);
    chunks = chunkCorpus(
      docs,
      parsed.chunkSize,
      R2_FROZEN.overlap,
      R2_FROZEN.splitStrategy,
    );
    retrieved = retrieveForR2(question, chunks, parsed);
  } else if (archetype === 'r3') {
    const parsed = parseR3Payload(payload);
    chunks = chunkCorpus(
      docs,
      R3_FROZEN.chunkSize,
      R3_FROZEN.overlap,
      R3_FROZEN.splitStrategy,
    );
    retrieved = frozenRetrieve(question, chunks);
    generation = groundedGenerate(parsed.generationPrompt, retrieved);
    citations = citedChunkIds(generation);
    refused = isRefusal(generation);
  } else if (archetype === 'r4') {
    const parsed = parseR4Payload(payload);
    chunks = chunkCorpus(
      docs,
      R3_FROZEN.chunkSize,
      R3_FROZEN.overlap,
      R3_FROZEN.splitStrategy,
    );
    baseline = retrieveRanked(question, chunks, K);
    retrieved = rerankForR4(question, chunks, parsed);
    if (parsed.queryRewritePrompt.trim()) {
      generation = `[Query rewrite prompt set — grading uses rewritten queries on submit.]`;
    }
  } else {
    const parsed = parseR1Payload(payload);
    chunks = chunkCorpus(
      docs,
      parsed.chunkSize,
      parsed.overlap,
      parsed.splitStrategy,
    );
    retrieved = retrieveRanked(question, chunks, K);
  }

  const contextTokens = estimateTokens(
    retrieved.map((row) => row.chunk.text).join('\n\n'),
  );

  return {
    archetype,
    chunkCount: chunks.length,
    chunks,
    retrieved: hitsToDto(retrieved),
    baseline: baseline ? hitsToDto(baseline) : null,
    generation,
    citations,
    refused,
    contextTokens,
    frozen: ragLabFrozen(slug),
  };
}

function hitsToDto(ranked: RankedChunk[]): RagLabHit[] {
  return ranked.map((row) => ({
    chunkId: row.chunk.id,
    docId: row.chunk.docId,
    title: row.chunk.title,
    score: row.score,
    text: row.chunk.text,
  }));
}

function retrieveForR2(
  question: string,
  chunks: Chunk[],
  payload: R2Payload,
): RankedChunk[] {
  const pool = payload.rerank
    ? Math.min(chunks.length, Math.max(payload.topK * 4, payload.topK))
    : payload.topK;
  const ranked = retrieveRanked(question, chunks, pool);
  if (!payload.rerank) {
    return ranked.slice(0, payload.topK);
  }
  return titleBoost(question, ranked).slice(0, payload.topK);
}

function frozenRetrieve(question: string, chunks: Chunk[]): RankedChunk[] {
  const pool = retrieveRanked(question, chunks, Math.min(chunks.length, 20));
  return titleBoost(question, pool).slice(0, K);
}

function rerankForR4(
  question: string,
  chunks: Chunk[],
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
