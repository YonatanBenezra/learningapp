import type { FailingCase, GateResult, MetricValue } from '../rag/rag.types';
import type { BenchmarkGradeResult } from '../benchmark/benchmark.types';

export type FineTuningApproach = 'prompt' | 'fine_tune';
export type FineTuningEconomics = 'prompt_wins' | 'fine_tune_wins';

export type F1Hidden = {
  volumePerMonth: number;
  horizonMonths: number;
  prompt: { setupEur: number; perCallEur: number };
  fineTune: { setupEur: number; perCallEur: number };
  goldApproach: FineTuningApproach;
  goldEconomics: FineTuningEconomics;
  canary?: { id: string; prompt: string };
};

export type F1Payload = {
  approachCall: FineTuningApproach;
  economicsCall: FineTuningEconomics;
};

export type DatasetIssue = 'leakage' | 'duplicate' | 'label_noise' | 'format';

export type DatasetRow = {
  id: string;
  split: 'train' | 'eval';
  prompt: string;
  label: string;
  canary?: boolean;
};

export type F2Hidden = {
  goldIssue: DatasetIssue;
  goldRowIds: string[];
  rows: DatasetRow[];
  canary?: { id: string; prompt: string };
};

export type F2Payload = {
  issue: DatasetIssue;
  rowIds: string[];
};

export type F4Hidden = {
  trainingExamples: number;
  goldAdapter: 'lora' | 'full_fine_tune' | 'prompt_only';
  acceptedRationale: Array<'cost' | 'data_scarcity' | 'latency' | 'quality'>;
  canary?: { id: string; prompt: string };
};

export type F4Payload = {
  adapterChoice: 'lora' | 'full_fine_tune' | 'prompt_only';
  rationale: 'cost' | 'data_scarcity' | 'latency' | 'quality';
};

export type FineTuningGradeResult = {
  verdict: 'pass' | 'fail';
  metrics: Record<string, MetricValue>;
  gateResults: GateResult[];
  failureClasses: string[];
  scorecard: Record<string, unknown>;
  failingCases: FailingCase[];
  trace: {
    simulator: 'fine_tuning';
    payload: Record<string, unknown>;
    sandbox: { durationMs: number; wallClock: 'information' };
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
  };
};

export type F3GradeResult = Omit<BenchmarkGradeResult, 'trace'> & {
  trace: Omit<BenchmarkGradeResult['trace'], 'simulator'> & {
    simulator: 'fine_tuning';
  };
};

export function isFineTuningCanary(row: { prompt?: string; canary?: boolean; id?: string }): boolean {
  return (
    row.canary === true ||
    row.id === 'canary' ||
    (typeof row.prompt === 'string' && row.prompt.includes('HIDDEN_EVAL'))
  );
}
