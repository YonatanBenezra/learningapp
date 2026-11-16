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
import { chunkForR2, R2_SPLIT, retrieveForR2 } from './r2.grade';
import { R4_FIRST_STAGE_LABEL, r4Baseline, rerankForR4 } from './r4.grade';
import { titleBoost } from './rerank';
import { expandGoldSpan } from './rag.shared';
import {
  chunkContainsSpan,
  retrieveRanked,
  type RankedChunk,
} from './retrieve';

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
  /** Public sample questions only: does this chunk carry the gold sentence? */
  containsAnswer: boolean | null;
};

/** Gold label of a PUBLIC sample question (never hidden-set data). */
export type RagLabPublicGold = {
  goldDocId: string;
  goldSpan: string;
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
  /** Same per-question token count the grader averages for this archetype. */
  contextTokens: number;
  /** Public sample questions only: is the gold sentence anywhere in the context? */
  answerFound: boolean | null;
  frozen: RagLabFrozen | null;
};

const K = 5;
const R3_FROZEN = {
  chunkSize: 400,
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
      // heading-aware keeps each document whole, whatever the chunk size.
      items: ['Whole-document chunks', 'BM25 + title boost', `Top k ${K}`],
    };
  }
  if (archetype === 'r4') {
    return {
      label: 'Chunking locked',
      items: ['Whole-document chunks', R4_FIRST_STAGE_LABEL],
    };
  }
  if (archetype === 'r2') {
    return {
      label: 'Split locked',
      items: [
        `Strategy ${R2_SPLIT.splitStrategy}`,
        `Overlap ${R2_SPLIT.overlap}`,
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
  publicGold: RagLabPublicGold | null = null,
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
    // Same chunking and retrieval as the R2 grader, so the preview matches grading.
    const parsed = parseR2Payload(payload);
    chunks = chunkForR2(docs, parsed);
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
    baseline = r4Baseline(question, chunks);
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

  const joined = retrieved.map((row) => row.chunk.text).join('\n\n');
  // R2 grades prompt tokens including the "Context:" header; the others grade
  // the bare context.
  const contextTokens = estimateTokens(
    archetype === 'r2' ? `Context:\n${joined}` : joined,
  );
  const gold = publicGold
    ? expandGoldSpan(docs, publicGold.goldDocId, publicGold.goldSpan)
    : null;
  const retrievedHits = hitsToDto(retrieved, gold);

  return {
    archetype,
    chunkCount: chunks.length,
    chunks,
    retrieved: retrievedHits,
    baseline: baseline ? hitsToDto(baseline, gold) : null,
    generation,
    citations,
    refused,
    contextTokens,
    answerFound: gold
      ? retrievedHits.some((hit) => hit.containsAnswer === true)
      : null,
    frozen: ragLabFrozen(slug),
  };
}

function hitsToDto(ranked: RankedChunk[], gold: string | null): RagLabHit[] {
  return ranked.map((row) => ({
    chunkId: row.chunk.id,
    docId: row.chunk.docId,
    title: row.chunk.title,
    score: row.score,
    text: row.chunk.text,
    containsAnswer: gold ? chunkContainsSpan(row.chunk.text, gold) : null,
  }));
}

function frozenRetrieve(question: string, chunks: Chunk[]): RankedChunk[] {
  const pool = retrieveRanked(question, chunks, Math.min(chunks.length, 20));
  return titleBoost(question, pool).slice(0, K);
}
