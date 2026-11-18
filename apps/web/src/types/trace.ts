export type TraceHit = {
  chunkId: string;
  docId: string;
  score: number;
  text: string;
  /** Public queries only: this chunk carries the gold sentence. */
  goldHit?: boolean;
  /** Rank before the rerank/boost step, when one ran. */
  firstStageRank?: number | null;
};

/** One pipeline step a question went through, as the grader ran it. */
export type TraceStage = {
  id: string;
  label: string;
  detail: string;
  /** Chunks that came out of the step. */
  count: number;
  /** Public questions: rank of the answer chunk after the step; null when gone. */
  goldRank?: number | null;
  ms: number;
};

export type TraceQuery = {
  source: string;
  question: string;
  /** Public questions: every pipeline step, with timings (newer runs only). */
  stages?: TraceStage[];
  /** R4: what the first stage searched for after the learner's rewrite prompt. */
  rewrittenQuery?: string;
  retrieved: TraceHit[];
  /** Public queries only: the gold sentence reached the context. */
  hit?: boolean;
  contextTokens?: number;
  queryId?: string;
  timingLabel?: string;
};

export type TraceStep = {
  index: number;
  kind: string;
  name: string;
  argsSummary: string;
  resultBytes: number;
  durationMs: number;
  ok: boolean;
  error?: string;
};

export type TraceCeilings = {
  maxSteps: number;
  maxToolCalls: number;
  stepsUsed: number;
  toolCallsUsed: number;
  killedLoop: boolean;
};

export type RunTrace = {
  runId: string;
  createdAt?: string;
  simulator?: string;
  payload?: Record<string, unknown>;
  k?: number;
  chunkCount?: number;
  tokensIn?: number;
  tokensOut?: number;
  costEurMicros?: number;
  queries?: TraceQuery[];
  steps?: TraceStep[];
  ceilings?: TraceCeilings;
  sandbox?: { durationMs?: number };
  gated?: boolean;
  message?: string;
};

