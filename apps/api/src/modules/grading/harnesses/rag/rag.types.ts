export type SplitStrategy =
  'fixed' | 'sentence' | 'recursive' | 'heading-aware';

export type RagPayload = {
  chunkSize: number;
  overlap: number;
  splitStrategy: SplitStrategy;
};

export type RetrievalMode = 'bm25' | 'dense' | 'hybrid';

/** english: bge-small. multilingual: e5-small, Bangla and English together. */
export type EmbeddingChoice = 'english' | 'multilingual';

/**
 * Metadata filter on document status: keep everything, drop superseded
 * versions (drafts stay), or keep current versions only.
 */
export type StatusFilter = 'none' | 'exclude-superseded' | 'current-only';

/** pre: filter, then take the top k. post: take the top k, then filter. */
export type FilterStage = 'pre' | 'post';

/**
 * Context packing: drop duplicate chunks before filling the token budget.
 * exact: identical text only. near: term overlap (Jaccard) at or above the
 * threshold.
 */
export type DedupeMode = 'none' | 'exact' | 'near';

export type R2Payload = {
  topK: number;
  rerank: boolean;
  chunkSize: number;
  /** First stage; BM25 when the exercise does not offer the choice. */
  retrievalMode?: RetrievalMode;
  /** Hybrid only: weight on the dense score (0 = BM25, 1 = dense). */
  hybridAlpha?: number;
  /** Dense and hybrid: which embedding model (default english). */
  embeddingModel?: EmbeddingChoice;
  /** Metadata filter on document status; none when the exercise does not offer it. */
  statusFilter?: StatusFilter;
  /** Where the filter runs relative to top-k (default pre). */
  filterStage?: FilterStage;
  /**
   * Set when the exercise packs the context: chunks are deduplicated, then
   * added in rank order while they fit the token budget.
   */
  dedupe?: DedupeMode;
  /** near only: Jaccard overlap that counts as a duplicate (default 0.8). */
  dedupeThreshold?: number;
  /**
   * Multi-hop: 2 runs a second search whose query is the question plus the
   * top `hopSeeds` passages of the first search. Context holds both result
   * sets. BM25 only.
   */
  hops?: 1 | 2;
  /** How many first-search passages feed the second query (default 1). */
  hopSeeds?: number;
  /**
   * What the second query adds to the question: the seed passages in full
   * (`passage`), or only the names they mention that the question does not
   * (`entities`: "Porto", "Iris", "Quill Batteries").
   */
  hopQuery?: HopQuery;
  /**
   * Score cutoff: after top-k, drop every chunk that scores below this share
   * of the best chunk's score, so a question with one clear answer sends one
   * chunk and a close race sends several. Absent or 0: keep all k.
   */
  minScoreRatio?: number;
  /**
   * Extractive compression: keep only this many sentences of each retrieved
   * chunk, the ones that share the most terms with the question, in their
   * original order. Absent or 0: send chunks whole.
   */
  compressSentences?: number;
  /**
   * Sentence window: send each retrieved chunk together with this many
   * neighbouring chunks of the same document on each side. Absent or 0: the
   * chunk alone.
   */
  expandNeighbors?: number;
};

export type HopQuery = 'passage' | 'entities';

export type R3Payload = {
  generationPrompt: string;
  /**
   * Refuse without calling the model when the best first-stage (BM25) score
   * is below this. 0 or absent: always call the model.
   */
  refuseBelowScore?: number;
};

export type RerankerKind = 'none' | 'title-boost' | 'mmr' | 'cross-encoder';

export type R4Payload = {
  reranker: RerankerKind;
  rerankTopN: number;
  queryRewritePrompt: string;
};

/**
 * feedback: a miss may be shown with its question text (never its gold).
 * holdout: only ever counted, per split and per tag. Assigned per question
 * text, so the same question is holdout in every exercise that uses it.
 */
export type EvalSplit = 'feedback' | 'holdout';

export type HiddenItem = {
  id: string;
  question: string;
  answerable: boolean;
  goldAnswer: string | null;
  goldDocId: string | null;
  goldSpan: string | null;
  /** Missing means holdout: nothing is revealed unless content opts in. */
  split?: EvalSplit;
  /** Question categories for the per-tag breakdown (see EVAL_TAGS). */
  tags?: string[];
  /**
   * Multi-hop questions: every passage the answer needs, in chain order
   * (bridge first). A hit needs all of them in context. When absent, the
   * evidence is goldDocId + goldSpan alone.
   */
  evidence?: { docId: string; span: string }[];
};

/** Counted outcome for a group of hidden questions. */
export type HitCount = { hits: number; total: number };

/** What a learner sees about the hidden set beyond the gates: counts only. */
export type EvalBreakdown = {
  bySplit: Record<EvalSplit, HitCount>;
  byTag: Record<string, HitCount>;
  /** Evidence for every miss (both splits), counted by cause. */
  diagnosis: Record<string, number>;
  /** 1-based first-stage rank of the gold chunk, for misses ranked below k. */
  goldRanks: number[];
  /** Where the context budget went, when the archetype has one. */
  cost?: {
    meanTokens: number;
    ceiling: number;
    meanChunks: number;
    meanTokensPerChunk: number;
  };
};

export type MetricValue = {
  value: number;
  [key: string]: number;
};

export type GateResult = {
  id: string;
  class: 'A' | 'B';
  metric: string;
  op: string;
  value: number;
  actual: number;
  passed: boolean;
  advisory?: boolean;
};

export type FailingCase = {
  question: string;
  goldSpan?: string;
  retrieved?: string[];
  /** R3: what the learner's prompt actually made the model answer. */
  answer?: string;
  note?: string;
};

export type RagGradeResult = {
  verdict: 'pass' | 'fail';
  metrics: Record<string, MetricValue>;
  gateResults: GateResult[];
  failureClasses: string[];
  scorecard: Record<string, unknown>;
  failingCases: FailingCase[];
  trace: RagTrace;
};

/** A public sample question; gold labels are public data, shown in traces. */
export type PublicItem = {
  question: string;
  goldDocId?: string | null;
  goldSpan?: string | null;
  /** R5 query class (faq / policy / procedural), when the exercise routes. */
  class?: string | null;
};

export type TraceQuery = {
  source: 'public' | 'failing_sample';
  question: string;
  /** R4: what the first stage searched for after the learner's rewrite. */
  rewrittenQuery?: string;
  /** Public queries only: the gold sentence reached the context. */
  hit?: boolean;
  /** Tokens this query put into the context (as the grader counts them). */
  contextTokens?: number;
  retrieved: {
    chunkId: string;
    docId: string;
    score: number;
    text: string;
    /** Public queries only: this chunk carries the gold sentence. */
    goldHit?: boolean;
    /** Rank before the rerank/boost step, when one ran (1-based). */
    firstStageRank?: number | null;
  }[];
};

export type RagTrace = {
  simulator: 'rag';
  payload: unknown;
  k: number;
  chunkCount: number;
  tokensIn: number;
  tokensOut: number;
  costEurMicros: number;
  queries: TraceQuery[];
};
