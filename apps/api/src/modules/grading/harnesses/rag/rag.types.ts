export type SplitStrategy =
  | 'fixed'
  | 'sentence'
  | 'recursive'
  | 'heading-aware';

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

export type HiddenItem = {
  id: string;
  question: string;
  answerable: boolean;
  goldAnswer: string | null;
  goldDocId: string | null;
  goldSpan: string | null;
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

export type TraceQuery = {
  source: 'public' | 'failing_sample';
  question: string;
  retrieved: {
    chunkId: string;
    docId: string;
    score: number;
    text: string;
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
