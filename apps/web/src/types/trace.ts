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

export type TraceQuery = {
  source: string;
  question: string;
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

