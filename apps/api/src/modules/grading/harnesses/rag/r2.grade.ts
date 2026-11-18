import { countTokens } from '../../gateway/pricing';
import { advisoryClassB } from '../../judge/class-b';
import {
  chunkCorpus,
  type Chunk,
  type CorpusDoc,
  sentencesOf,
} from './chunking';
import { jaccard, titleBoost } from './rerank';
import { type Gold, holdsGold, type RankedChunk, tokenize } from './retrieve';
import {
  prepareRetriever,
  type Retriever,
  retrieverLabel,
  retrieverSpecOf,
} from './retrievers';
import {
  answerableHidden,
  costEvidence,
  declaresGate,
  diagnoseRetrievalMiss,
  EvalLedger,
  goldOf,
  gateThreshold,
  type MissCause,
  publicGold,
  publicTraceItems,
  toTraceQuery,
} from './rag.shared';
import type {
  GateResult,
  HiddenItem,
  PublicItem,
  R2Payload,
  RagGradeResult,
  StatusFilter,
  TraceQuery,
} from './rag.types';

const DEFAULT_RECALL = 0.8;
const DEFAULT_TOKEN_CEILING = 2000;
const DEFAULT_STALE_CEILING = 0.05;
const DEFAULT_DEDUPE_THRESHOLD = 0.8;

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

export async function gradeR2(
  payload: R2Payload,
  docs: CorpusDoc[],
  hidden: HiddenItem[],
  publicItems: PublicItem[] = [],
  gates?: unknown,
): Promise<RagGradeResult> {
  const recallThreshold = gateThreshold(gates, 'recall@k', DEFAULT_RECALL);
  const tokenCeiling = gateThreshold(
    gates,
    'mean_prompt_tokens',
    DEFAULT_TOKEN_CEILING,
  );
  const chunks = chunkForR2(docs, payload);
  const answerable = answerableHidden(hidden);
  const shownPublic = publicTraceItems(publicItems);
  const spec = retrieverSpecOf(payload);
  const retriever = await prepareRetriever(chunks, spec, [
    ...answerable.map((item) => item.question),
    ...shownPublic.map((item) => item.question),
  ]);
  const misses: RagGradeResult['failingCases'] = [];
  const failingQueries: TraceQuery[] = [];
  const ledger = new EvalLedger();
  const perQuery: { tokens: number; chunks: number }[] = [];
  let hits = 0;
  const tokenCounts: number[] = [];
  const familyOf = new Map(docs.map((doc) => [doc.id, doc.meta?.family]));
  let versioned = 0;
  let staleQuestions = 0;

  for (const item of answerable) {
    const {
      retrieved,
      shaped,
      duplicates,
      context: ranked,
    } = contextForR2(item.question, retriever, payload, tokenCeiling);
    // Recall is judged on exactly the text that is sent as context.
    const tokens = countTokens(contextText(ranked));
    tokenCounts.push(tokens);
    perQuery.push({ tokens, chunks: ranked.length });
    const gold = goldOf(
      docs,
      item.goldDocId as string,
      item.goldSpan as string,
    );
    // Multi-hop questions need every piece of evidence in context.
    const evidence = item.evidence?.length
      ? item.evidence.map((piece) => goldOf(docs, piece.docId, piece.span))
      : [gold];
    const missing = evidence.filter(
      (piece) => !ranked.some((row) => holdsGold(row.chunk, piece)),
    );
    const hit = missing.length === 0;
    const family = familyOf.get(gold.docId);
    if (family) {
      versioned += 1;
      // Another version of the same policy in context: two answers disagree.
      if (
        ranked.some(
          (row) =>
            row.chunk.docId !== gold.docId && row.chunk.meta?.family === family,
        )
      ) {
        staleQuestions += 1;
      }
    }
    ledger.record(
      item,
      hit,
      hit
        ? null
        : evidence.length > 1
          ? {
              // Which link of the chain the context lacks.
              code: missing.includes(evidence[0])
                ? 'bridge-passage-missing'
                : 'answer-passage-missing',
            }
          : retrieved.some((row) => holdsGold(row.chunk, gold)) &&
              !shaped.some((row) => holdsGold(row.chunk, gold))
            ? // Retrieved, then cut out by compression.
              { code: 'compressed-away' }
            : shaped.some((row) => holdsGold(row.chunk, gold))
              ? // Retrieved, then lost while packing the context.
                {
                  code: duplicates.some((row) => holdsGold(row.chunk, gold))
                    ? 'deduped-away'
                    : 'packed-out-by-budget',
                }
              : diagnoseR2Miss(item.question, retriever, payload, gold),
    );
    if (hit) {
      hits += 1;
    } else if (ledger.reveal(item)) {
      misses.push({
        question: item.question,
        goldSpan: gold.text,
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
  const staleRate = versioned === 0 ? 0 : staleQuestions / versioned;
  const staleCeiling = gateThreshold(
    gates,
    'stale_context_rate',
    DEFAULT_STALE_CEILING,
  );
  const staleGate = declaresGate(gates, 'stale_context_rate');
  const stalePass = !staleGate || staleRate <= staleCeiling;
  const recallPass = recall >= recallThreshold;
  const costPass = meanTokens <= tokenCeiling;
  const passed = recallPass && costPass && stalePass;
  ledger.setCost(costEvidence(perQuery, tokenCeiling));
  ledger.note('stale-version-in-context', staleQuestions);
  const staleGates: GateResult[] = staleGate
    ? [
        {
          id: 'stale-context-rate',
          class: 'A',
          metric: 'stale_context_rate',
          op: 'lte',
          value: staleCeiling,
          actual: staleRate,
          passed: stalePass,
        },
      ]
    : [];

  return {
    verdict: passed ? 'pass' : 'fail',
    metrics: {
      recall_at_k: { value: recall, hits, total },
      mean_prompt_tokens: { value: meanTokens },
      ...(versioned > 0
        ? {
            stale_context_rate: {
              value: staleRate,
              stale: staleQuestions,
              total: versioned,
            },
          }
        : {}),
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
      ...staleGates,
      advisoryClassB('answer-correctness', 'answer_correctness'),
    ],
    failureClasses: passed
      ? []
      : [
          ...(costPass ? [] : ['context-over-budget']),
          ...(stalePass ? [] : ['stale-version-in-context']),
          ...(recallPass
            ? []
            : ledger
                .topCauses()
                .filter((code) => code !== 'stale-version-in-context')),
        ],
    scorecard: {
      recallAtK: recall,
      meanPromptTokens: meanTokens,
      tokenCeiling: tokenCeiling,
      topK: payload.topK,
      rerank: payload.rerank,
      retrieval: retrieverLabel(retriever.spec),
      ...(payload.statusFilter
        ? {
            statusFilter: payload.statusFilter,
            filterStage: payload.filterStage ?? 'pre',
          }
        : {}),
      chunks: chunks.length,
      breakdown: ledger.breakdown(),
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
        ...shownPublic.map((item) => {
          const { context: ranked } = contextForR2(
            item.question,
            retriever,
            payload,
            tokenCeiling,
          );
          return toTraceQuery('public', item.question, ranked, {
            gold: publicGold(docs, item),
            firstStage: payload.rerank
              ? firstStageForR2(item.question, retriever, payload).slice(
                  0,
                  rerankPool(payload, chunks),
                )
              : null,
            contextTokens: countTokens(contextText(ranked)),
          });
        }),
        ...failingQueries,
      ],
    },
  };
}

/** Evidence for an R2-style miss (also used by R5 per class). */
export function diagnoseR2Miss(
  question: string,
  retriever: Retriever,
  payload: R2Payload,
  gold: Gold,
): MissCause {
  const { chunks } = retriever;
  const fullRanking = firstStageForR2(question, retriever, payload);
  if (
    (payload.minScoreRatio ?? 0) > 0 &&
    retrieveForR2(question, retriever, { ...payload, minScoreRatio: 0 }).some(
      (row) => holdsGold(row.chunk, gold),
    )
  ) {
    // In the top k, but scored below the cutoff.
    return { code: 'cut-by-score-ratio' };
  }
  if (
    filterStage(payload) === 'post' &&
    retrieveForR2(question, retriever, payload).length < payload.topK
  ) {
    // The filter ran after top-k and threw results away.
    const index = fullRanking.findIndex((row) => holdsGold(row.chunk, gold));
    return {
      code: 'post-filter-dropped-results',
      rank: index < 0 ? fullRanking.length + 1 : index + 1,
    };
  }
  return diagnoseRetrievalMiss({
    chunks,
    gold,
    fullRanking,
    k: payload.topK,
    pool: payload.rerank ? rerankPool(payload, chunks) : null,
  });
}

/** The prompt text the context tokens are counted on. */
export function contextText(ranked: RankedChunk[]): string {
  return `Context:\n${ranked.map((row) => row.chunk.text).join('\n\n')}`;
}

/**
 * What reaches the model: the retrieved chunks, widened to their neighbours
 * or compressed to their best sentences when the exercise offers that, then
 * (when the exercise packs the context) duplicates dropped and the rest added
 * in rank order while they fit `budget` tokens.
 */
export function contextForR2(
  question: string,
  retriever: Retriever,
  payload: R2Payload,
  budget: number,
): {
  retrieved: RankedChunk[];
  /** After the sentence window and compression. */
  shaped: RankedChunk[];
  /** Dropped as a duplicate of a higher-ranked chunk. */
  duplicates: RankedChunk[];
  context: RankedChunk[];
} {
  const retrieved = withSecondHop(
    question,
    retriever,
    payload,
    retrieveForR2(question, retriever, payload),
  );
  const shaped = compress(
    question,
    withNeighbors(retriever.chunks, retrieved, payload.expandNeighbors ?? 0),
    payload.compressSentences ?? 0,
  );
  if (payload.dedupe === undefined) {
    return { retrieved, shaped, duplicates: [], context: shaped };
  }
  const kept: RankedChunk[] = [];
  const duplicates: RankedChunk[] = [];
  for (const row of shaped) {
    if (kept.some((other) => isDuplicate(other, row, payload))) {
      duplicates.push(row);
    } else {
      kept.push(row);
    }
  }
  const context: RankedChunk[] = [];
  for (const row of kept) {
    if (countTokens(contextText([...context, row])) <= budget) {
      context.push(row);
    }
  }
  return { retrieved, shaped, duplicates, context };
}

/**
 * Sentence window ("small to big"): each hit grows to the `radius` chunks
 * before and after it in its document. Windows of the same document that
 * touch or overlap merge into one, kept at the rank of their best hit.
 */
export function withNeighbors(
  chunks: Chunk[],
  hits: RankedChunk[],
  radius: number,
): RankedChunk[] {
  if (radius <= 0 || hits.length === 0) {
    return hits;
  }
  const byDoc = new Map<string, Chunk[]>();
  for (const chunk of chunks) {
    const list = byDoc.get(chunk.docId) ?? [];
    list.push(chunk);
    byDoc.set(chunk.docId, list);
  }
  type Window = { docId: string; from: number; to: number; score: number };
  const windows: Window[] = [];
  for (const hit of hits) {
    const siblings = byDoc.get(hit.chunk.docId) ?? [hit.chunk];
    const index = siblings.findIndex((chunk) => chunk.id === hit.chunk.id);
    const from = Math.max(0, index - radius);
    const to = Math.min(siblings.length - 1, index + radius);
    const open = windows.find(
      (window) =>
        window.docId === hit.chunk.docId &&
        from <= window.to + 1 &&
        to >= window.from - 1,
    );
    if (open) {
      open.from = Math.min(open.from, from);
      open.to = Math.max(open.to, to);
    } else {
      windows.push({ docId: hit.chunk.docId, from, to, score: hit.score });
    }
  }
  return windows.map((window) => {
    const parts = (byDoc.get(window.docId) ?? []).slice(
      window.from,
      window.to + 1,
    );
    return {
      score: window.score,
      chunk: {
        ...parts[0],
        id: `${window.docId}:${window.from}-${window.to}`,
        text: parts.map((part) => part.text).join(' '),
      },
    };
  });
}

/**
 * Extractive compression: each chunk keeps the `keep` sentences that share
 * the most distinct terms with the question (ties go to the earlier one), in
 * their original order.
 */
export function compress(
  question: string,
  ranked: RankedChunk[],
  keep: number,
): RankedChunk[] {
  if (keep <= 0) {
    return ranked;
  }
  const terms = new Set(tokenize(question));
  return ranked.map((row) => {
    const sentences = sentencesOf(row.chunk.text);
    if (sentences.length <= keep) {
      return row;
    }
    const best = sentences
      .map((sentence, index) => ({
        index,
        overlap: new Set(tokenize(sentence).filter((term) => terms.has(term)))
          .size,
      }))
      .sort((a, b) => b.overlap - a.overlap || a.index - b.index)
      .slice(0, keep)
      .map((entry) => entry.index)
      .sort((a, b) => a - b);
    return {
      ...row,
      chunk: {
        ...row.chunk,
        text: best.map((index) => sentences[index]).join(' '),
      },
    };
  });
}

function isDuplicate(
  kept: RankedChunk,
  candidate: RankedChunk,
  payload: R2Payload,
): boolean {
  if (payload.dedupe === 'exact') {
    return (
      normalizeText(kept.chunk.text) === normalizeText(candidate.chunk.text)
    );
  }
  if (payload.dedupe === 'near') {
    return (
      jaccard(kept.chunk.text, candidate.chunk.text) >=
      (payload.dedupeThreshold ?? DEFAULT_DEDUPE_THRESHOLD)
    );
  }
  return false;
}

const normalizeText = (text: string) =>
  text.toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Multi-hop: search again with the question plus the top `hopSeeds` passages
 * of the first search, and add new results after the first ones. The second
 * query carries what the first search learned (a city, a team, a supplier).
 */
function withSecondHop(
  question: string,
  retriever: Retriever,
  payload: R2Payload,
  first: RankedChunk[],
): RankedChunk[] {
  if (payload.hops !== 2) {
    return first;
  }
  if (retriever.spec.mode !== 'bm25') {
    throw new Error('A second hop runs on BM25 retrieval only');
  }
  const seeds = first.slice(0, payload.hopSeeds ?? 1);
  const followUp =
    payload.hopQuery === 'entities'
      ? [question, ...newNames(question, seeds)].join(' ')
      : [question, ...seeds.map((row) => row.chunk.text)].join(' ');
  const seen = new Set(first.map((row) => row.chunk.id));
  const second = retriever
    .rank(followUp, retriever.chunks.length)
    .filter((row) => !seen.has(row.chunk.id))
    .slice(0, payload.topK);
  return [...first, ...second];
}

/**
 * Names the seed passages mention that the question does not: capitalised
 * words that do not start a sentence ("in Porto in March", "by Quill
 * Batteries"). What a reader would carry into the next search.
 */
export function newNames(question: string, seeds: RankedChunk[]): string[] {
  const asked = new Set(question.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []);
  const names = new Set<string>();
  for (const row of seeds) {
    for (const sentence of row.chunk.text.split(/(?<=[.!?])\s+/)) {
      const words = sentence.match(/[\p{L}\p{N}][\p{L}\p{N}'-]*/gu) ?? [];
      words.slice(1).forEach((word) => {
        if (/^\p{Lu}/u.test(word) && !asked.has(word.toLowerCase())) {
          names.add(word);
        }
      });
    }
  }
  return [...names];
}

/** Does a chunk pass a status filter? Documents without a status always do. */
export function passesStatusFilter(
  chunk: Chunk,
  filter: StatusFilter | undefined,
): boolean {
  const status = chunk.meta?.status;
  if (!filter || filter === 'none' || !status) {
    return true;
  }
  if (filter === 'exclude-superseded') {
    return status !== 'superseded';
  }
  return status === 'current';
}

function filterStage(payload: R2Payload): 'pre' | 'post' | null {
  if (!payload.statusFilter || payload.statusFilter === 'none') {
    return null;
  }
  return payload.filterStage ?? 'pre';
}

/** Full first-stage ranking, with a pre-filter applied when there is one. */
export function firstStageForR2(
  question: string,
  retriever: Retriever,
  payload: R2Payload,
): RankedChunk[] {
  const ranked = retriever.rank(question, retriever.chunks.length);
  return filterStage(payload) === 'pre'
    ? ranked.filter((row) =>
        passesStatusFilter(row.chunk, payload.statusFilter),
      )
    : ranked;
}

/** Candidates fetched before the title boost when rerank is on. */
export function rerankPool(payload: R2Payload, chunks: Chunk[]): number {
  return Math.min(chunks.length, Math.max(payload.topK * 4, payload.topK));
}

export function retrieveForR2(
  question: string,
  retriever: Retriever,
  payload: R2Payload,
): RankedChunk[] {
  const pool = payload.rerank
    ? rerankPool(payload, retriever.chunks)
    : payload.topK;
  const stage = filterStage(payload);
  const ranked =
    stage === 'pre'
      ? firstStageForR2(question, retriever, payload).slice(0, pool)
      : retriever.rank(question, pool);
  const top = (payload.rerank ? titleBoost(question, ranked) : ranked).slice(
    0,
    payload.topK,
  );
  // Post-filter: the top k come back first, then non-matching ones are dropped.
  const kept =
    stage === 'post'
      ? top.filter((row) => passesStatusFilter(row.chunk, payload.statusFilter))
      : top;
  return scoreCutoff(kept, payload.minScoreRatio ?? 0);
}

/** Keeps the chunks scoring at least `ratio` of the best one's score. */
export function scoreCutoff(
  ranked: RankedChunk[],
  ratio: number,
): RankedChunk[] {
  if (ratio <= 0 || ranked.length === 0) {
    return ranked;
  }
  const best = ranked[0].score;
  return ranked.filter((row) => row.score >= best * ratio);
}
