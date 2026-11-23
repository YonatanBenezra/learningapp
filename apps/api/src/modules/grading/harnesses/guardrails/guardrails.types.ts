export type GuardrailsItem = {
  id: string;
  kind: 'attack' | 'benign';
  category?: string;
  adversarial?: boolean;
  /** Forces the feedback/holdout split, e.g. a family kept only in holdout. */
  split?: 'feedback' | 'holdout';
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
      retrieved: {
        chunkId: string;
        docId: string;
        score: number;
        text: string;
      }[];
    }[];
    toolCalls?: unknown[];
    /** G1/G2: each level as it ran. */
    levels?: unknown[];
    /** G3: some feedback messages, layer by layer. */
    cases?: unknown[];
  };
};

export function isGuardCanary(item: unknown): boolean {
  return JSON.stringify(item).includes('HIDDEN_EVAL');
}
