export type GuardrailsItem = {
  id: string;
  kind: 'attack' | 'benign';
  category?: string;
  adversarial?: boolean;
  text: string;
};

export type GuardrailsGradeResult = {
  verdict: 'pass' | 'fail' | 'inconclusive';
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
  }[];
  sampleSeed?: string;
  trace: {
    simulator: 'guardrails';
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
    toolCalls?: unknown[];
  };
};

export function isGuardCanary(item: unknown): boolean {
  return JSON.stringify(item).includes('HIDDEN_EVAL');
}
