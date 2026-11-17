export type SplitStrategy =
  'fixed' | 'sentence' | 'recursive' | 'heading-aware';

export type RagPayload = {
  chunkSize: number;
  overlap: number;
  splitStrategy: SplitStrategy;
};

export type R2Payload = {
  topK: number;
  rerank: boolean;
  chunkSize: number;
};

export type R3Payload = {
  generationPrompt: string;
};

export type RerankerKind = 'none' | 'title-boost' | 'mmr';

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
