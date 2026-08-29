export type PeItem = {
  id: string;
  input: string;
  gold: {
    ticket_id: string;
    priority: 'low' | 'medium' | 'high';
    category: string;
  };
};

export type P1Payload = {
  systemPrompt: string;
  fewShotBlock: string;
};

export type PeHarnessGradeResult = {
  verdict: 'pass' | 'fail';
  metrics: Record<string, { value: number; [key: string]: number | string }>;
  gateResults: {
    id: string;
    class: 'A';
    metric: string;
    op: string;
    value: number;
    actual: number;
    passed: boolean;
  }[];
  failureClasses: string[];
  scorecard: Record<string, unknown>;
  failingCases: {
    question?: string;
    output?: string;
    note?: string;
  }[];
  trace: {
    simulator: 'prompt_engineering';
    payload: P1Payload;
    k: number;
    chunkCount: number;
    tokensIn: number;
    tokensOut: number;
    costEurMicros: number;
    queries: {
      source: 'public' | 'hidden_sample';
      question: string;
      retrieved: { chunkId: string; docId: string; score: number; text: string }[];
    }[];
  };
};

export function isPeCanary(item: PeItem): boolean {
  return JSON.stringify(item).includes('HIDDEN_EVAL');
}
