import type {
  NeuralNetworkDiagnosis,
  NeuralNetworkKnob,
  NeuralNetworkPayload,
} from './neural-network.types';

const DIAGNOSES = new Set<NeuralNetworkDiagnosis>([
  'overfitting',
  'underfitting',
  'good_fit',
]);

const KNOBS = new Set<NeuralNetworkKnob>([
  'add_dropout',
  'add_regularization',
  'reduce_capacity',
  'increase_capacity',
  'increase_data',
  'none_needed',
]);

export function parseNeuralNetworkPayload(
  payload: unknown,
): NeuralNetworkPayload {
  if (payload === null || typeof payload !== 'object') {
    throw new Error('Neural network payload must be an object');
  }
  const record = payload as Record<string, unknown>;
  const overfitRun = record.overfitRun;
  const diagnosis = record.diagnosis;
  const nextKnob = record.nextKnob;
  if (typeof overfitRun !== 'string' || overfitRun.trim().length === 0) {
    throw new Error('overfitRun is required');
  }
  if (
    typeof diagnosis !== 'string' ||
    !DIAGNOSES.has(diagnosis as NeuralNetworkDiagnosis)
  ) {
    throw new Error('diagnosis must be overfitting, underfitting, or good_fit');
  }
  if (typeof nextKnob !== 'string' || !KNOBS.has(nextKnob as NeuralNetworkKnob)) {
    throw new Error('nextKnob is invalid');
  }
  return {
    overfitRun,
    diagnosis: diagnosis as NeuralNetworkDiagnosis,
    nextKnob: nextKnob as NeuralNetworkKnob,
  };
}
