import { countTokens } from '../../gateway/pricing';
import {
  isRagR5Slug,
  isRagRedTeamSlug,
  isRagR1Slug,
  isRagR2Slug,
  isRagR3Slug,
  isRagR4Slug,
  isSandboxRagSlug,
} from '../../../catalogue/exercises/exercises.constants';
import { chunkCorpus, type Chunk, type CorpusDoc } from './chunking';
import {
  parseR1Payload,
  parseR2Payload,
  parseR3Payload,
  parseR4Payload,
} from './rag.payloads';
import { chunkForR2, R2_SPLIT, retrieveForR2 } from './r2.grade';
import {
  chunkForR4,
  type QueryRewriter,
  R4_FIRST_STAGE_LABEL,
  r4Baseline,
  rerankForR4,
  rewriteQueries,
} from './r4.grade';
import { isR5Class, parseR5Payload, routeR5 } from './r5.grade';
import { titleBoost } from './rerank';
import { expandGoldSpan } from './rag.shared';
import {
  chunkContainsSpan,
  retrieveRanked,
  type RankedChunk,
} from './retrieve';
import {
  BM25_RETRIEVER,
  prepareRetriever,
  retrieverLabel,
  retrieverSpecOf,
} from './retrievers';

export type RagLabArchetype =
  'r1' | 'r2' | 'r3' | 'r4' | 'r5' | 'redteam' | 'sandbox' | 'unknown';

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

/** A chunk as the lab shows it, with its exact token count. */
export type RagLabChunk = Chunk & { tokens: number };

export type RagLabPreview = {
  archetype: RagLabArchetype;
  chunkCount: number;
  chunks: RagLabChunk[];
  /** How the first stage ranked: BM25, Dense, Hybrid (alpha), or R4's keyword count. */
  retrieval: string;
  /** R4: the query the first stage searched with, when a rewrite ran. */
  rewrittenQuery: string | null;
  /** R4: a rewrite prompt is set but was not run (it needs an explicit request). */
  rewriteSkipped: boolean;
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
  splitStrategy: 'document' as const,
};

export function ragLabArchetype(slug: string): RagLabArchetype {
  if (isRagRedTeamSlug(slug)) {
    return 'redteam';
  }
  if (isRagR5Slug(slug)) {
    return 'r5';
  }
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
      items: ['Whole-document chunks', 'BM25 + title boost', `Top k ${K}`],
    };
  }
  if (archetype === 'r4') {
    return {
      label: 'Chunking locked',
      items: ['Whole-document chunks', R4_FIRST_STAGE_LABEL],
    };
  }
  if (archetype === 'r5') {
    return {
      label: 'Router given',
      items: [
        `Strategy ${R2_SPLIT.splitStrategy}`,
        `Overlap ${R2_SPLIT.overlap}`,
        'Class from the router',
      ],
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

/**
 * The grader's own chunking and ranking for one question, on data the learner
 * may see. R4 runs the rewrite prompt only when `rewriter` is given (a live
 * model call); otherwise it ranks the question as asked and says so.
 */
export async function previewRagLabWithCorpus(
  slug: string,
  payload: unknown,
  question: string,
  docs: CorpusDoc[],
  publicGold: RagLabPublicGold | null = null,
  /** R5: which class profile to route the question through. */
  queryClass: string | null = null,
  rewriter: QueryRewriter | null = null,
): Promise<RagLabPreview> {
  const archetype = ragLabArchetype(slug);
  if (archetype === 'sandbox') {
    throw new Error('Sandbox exercises use the Python editor lab');
  }
  if (archetype === 'redteam') {
    throw new Error(
      'Red team exercises use the target bot, not retrieval previews',
    );
  }

  let chunks: Chunk[];
  let retrieved: RankedChunk[];
  let baseline: RankedChunk[] | null = null;
  let retrieval = retrieverLabel(BM25_RETRIEVER);
  let rewrittenQuery: string | null = null;
  let rewriteSkipped = false;

  if (archetype === 'r5') {
    const routed = routeR5(
      question,
      isR5Class(queryClass) ? queryClass : 'faq',
      docs,
      parseR5Payload(payload),
    );
    chunks = routed.chunks;
    retrieved = routed.ranked;
  } else if (archetype === 'r2') {
    // Same chunking and retrieval as the R2 grader, so the preview matches grading.
    const parsed = parseR2Payload(payload);
    chunks = chunkForR2(docs, parsed);
    const retriever = await prepareRetriever(chunks, retrieverSpecOf(parsed), [
      question,
    ]);
    retrieval = retrieverLabel(retriever.spec);
    retrieved = retrieveForR2(question, retriever, parsed);
  } else if (archetype === 'r3') {
    chunks = chunkCorpus(
      docs,
      R3_FROZEN.chunkSize,
      R3_FROZEN.overlap,
      R3_FROZEN.splitStrategy,
    );
    // Validates the payload; the answer itself comes from the live model
    // (RagLabService.preview), the same call the grader makes.
    parseR3Payload(payload);
    retrieval = 'BM25 + title boost';
    retrieved = frozenRetrieve(question, chunks);
  } else if (archetype === 'r4') {
    const parsed = parseR4Payload(payload);
    chunks = chunkForR4(docs);
    retrieval = R4_FIRST_STAGE_LABEL;
    baseline = r4Baseline(question, chunks);
    let searchQuery = question;
    if (parsed.queryRewritePrompt.trim()) {
      if (rewriter) {
        searchQuery =
          (await rewriteQueries(parsed, [question], rewriter)).get(question) ??
          question;
        rewrittenQuery = searchQuery;
      } else {
        rewriteSkipped = true;
      }
    }
    retrieved = await rerankForR4(question, chunks, parsed, searchQuery);
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
  const contextTokens = countTokens(
    archetype === 'r2' || archetype === 'r5' ? `Context:\n${joined}` : joined,
  );
  const gold = publicGold
    ? expandGoldSpan(docs, publicGold.goldDocId, publicGold.goldSpan)
    : null;
  const retrievedHits = hitsToDto(retrieved, gold);

  return {
    archetype,
    chunkCount: chunks.length,
    chunks: chunks.map((chunk) => ({
      ...chunk,
      tokens: countTokens(chunk.text),
    })),
    retrieval,
    rewrittenQuery,
    rewriteSkipped,
    retrieved: retrievedHits,
    baseline: baseline ? hitsToDto(baseline, gold) : null,
    generation: null,
    citations: [],
    refused: false,
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

export type RagLabEstimateRow = {
  id: string;
  question: string;
  answerable: boolean;
  contextTokens: number;
  answerFound: boolean | null;
  /** 1-based rank of the first chunk carrying the gold sentence, if retrieved. */
  goldRank: number | null;
  /** Same, before reranking (R4 first stage only). */
  firstStageGoldRank: number | null;
};

export type RagLabEstimate = {
  archetype: RagLabArchetype;
  /** R4: the rewrite prompt was not run, so rows rank the questions as asked. */
  rewriteSkipped: boolean;
  questions: number;
  meanContextTokens: number;
  answerable: number;
  answersFound: number;
  rows: RagLabEstimateRow[];
};

export type RagLabPublicItem = {
  id: string;
  question: string;
  answerable: boolean;
  gold: RagLabPublicGold | null;
  /** R5 query class of this public sample. */
  queryClass?: string | null;
};

function goldRankOf(hits: RagLabHit[] | null): number | null {
  if (!hits) {
    return null;
  }
  const index = hits.findIndex((hit) => hit.containsAnswer === true);
  return index < 0 ? null : index + 1;
}

/**
 * Runs the current config over every PUBLIC sample question: the same numbers
 * the grader measures, on data the learner may see. Not a grade. Never calls
 * a model, so R4 rewrites are skipped (and flagged).
 */
export async function estimateRagLabWithCorpus(
  slug: string,
  payload: unknown,
  items: RagLabPublicItem[],
  docs: CorpusDoc[],
): Promise<RagLabEstimate> {
  const rows: RagLabEstimateRow[] = [];
  let rewriteSkipped = false;
  for (const item of items) {
    const preview = await previewRagLabWithCorpus(
      slug,
      payload,
      item.question,
      docs,
      item.gold,
      item.queryClass ?? null,
    );
    rewriteSkipped ||= preview.rewriteSkipped;
    rows.push({
      id: item.id,
      question: item.question,
      answerable: item.answerable,
      contextTokens: preview.contextTokens,
      answerFound: preview.answerFound,
      goldRank: goldRankOf(preview.retrieved),
      firstStageGoldRank: goldRankOf(preview.baseline),
    });
  }
  const graded = rows.filter((row) => row.answerFound !== null);
  return {
    archetype: ragLabArchetype(slug),
    rewriteSkipped,
    questions: rows.length,
    meanContextTokens:
      rows.length === 0
        ? 0
        : rows.reduce((sum, row) => sum + row.contextTokens, 0) / rows.length,
    answerable: graded.length,
    answersFound: graded.filter((row) => row.answerFound === true).length,
    rows,
  };
}
