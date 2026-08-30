export type TraceHit = {
  chunkId: string;
  docId: string;
  score: number;
  text: string;
};

export type TraceQuery = {
  source: string;
  question: string;
  retrieved: TraceHit[];
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
  gated?: boolean;
  message?: string;
};
