import type { FailingCase, GateResult, MetricValue } from '../rag/rag.types';

export type NeuralNetworkEpoch = {
  epoch: number;
  trainAcc: number;
  valAcc: number;
};

export type NeuralNetworkRun = {
  id: string;
  config: string;
  epochs: NeuralNetworkEpoch[];
  canary?: boolean;
};

export type NeuralNetworkHidden = {
  targetRun: string;
  expectedDiagnosis: NeuralNetworkDiagnosis;
  acceptedKnobs: NeuralNetworkKnob[];
  runs: NeuralNetworkRun[];
  canary?: { id: string; prompt: string };
};

export type NeuralNetworkDiagnosis =
  | 'overfitting'
  | 'underfitting'
  | 'good_fit';

export type NeuralNetworkKnob =
  | 'add_dropout'
  | 'add_regularization'
  | 'reduce_capacity'
  | 'increase_capacity'
  | 'increase_data'
  | 'none_needed';

export type NeuralNetworkPayload = {
  overfitRun: string;
  diagnosis: NeuralNetworkDiagnosis;
  nextKnob: NeuralNetworkKnob;
};

export type NeuralNetworkGradeResult = {
  verdict: 'pass' | 'fail';
  metrics: Record<string, MetricValue>;
  gateResults: GateResult[];
  failureClasses: string[];
  scorecard: Record<string, unknown>;
  failingCases: FailingCase[];
  trace: {
    simulator: 'neural_network';
    payload: NeuralNetworkPayload;
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

export function isNeuralNetworkCanary(run: NeuralNetworkRun): boolean {
  return (
    run.canary === true ||
    run.config.includes('HIDDEN_EVAL') ||
    run.id === 'canary'
  );
}
