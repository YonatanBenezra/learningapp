export type EvalItem = {
  id: string;
  input?: string;
  output?: string;
  v1?: string;
  v2?: string;
  humanLabel?: 'pass' | 'fail';
  v1Pass?: boolean;
  v2Pass?: boolean;
  trap?: boolean;
  meta?: Record<string, unknown>;
};

export type HarnessGradeResult = {
  verdict: 'pass' | 'fail';
  metrics: Record<string, { value: number; [key: string]: number }>;
  gateResults: {
    id: string;
    class: 'A' | 'B';
    metric: string;
    op: string;
    value: number;
    actual: number;
    passed: boolean;
    advisory?: boolean;
  }[];
  failureClasses: string[];
  scorecard: Record<string, unknown>;
  failingCases: {
    question?: string;
    output?: string;
    note?: string;
    goldSpan?: string;
    retrieved?: string[];
  }[];
  trace: {
    simulator: 'evaluation';
    payload: unknown;
    k: number;
    chunkCount: number;
    tokensIn: number;
    tokensOut: number;
    costEurMicros: number;
    queries: {
      source: 'public' | 'failing_sample';
      question: string;
      retrieved: { chunkId: string; docId: string; score: number; text: string }[];
    }[];
  };
};

export function isEvalCanary(item: EvalItem): boolean {
  return JSON.stringify(item).includes('HIDDEN_EVAL');
}
