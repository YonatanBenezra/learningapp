import type {
  DatasetIssue,
  F1Payload,
  F2Payload,
  F4Payload,
  FineTuningApproach,
  FineTuningEconomics,
} from './fine-tuning.types';

const APPROACHES = new Set<FineTuningApproach>(['prompt', 'fine_tune']);
const ECONOMICS = new Set<FineTuningEconomics>(['prompt_wins', 'fine_tune_wins']);
const ISSUES = new Set<DatasetIssue>([
  'leakage',
  'duplicate',
  'label_noise',
  'format',
]);
const ADAPTERS = new Set<F4Payload['adapterChoice']>([
  'lora',
  'full_fine_tune',
  'prompt_only',
]);
const RATIONALES = new Set<F4Payload['rationale']>([
  'cost',
  'data_scarcity',
  'latency',
  'quality',
]);

export function parseF1Payload(payload: unknown): F1Payload {
  if (payload === null || typeof payload !== 'object') {
    throw new Error('Fine-tuning payload must be an object');
  }
  const record = payload as Record<string, unknown>;
  if (
    typeof record.approachCall !== 'string' ||
    !APPROACHES.has(record.approachCall as FineTuningApproach)
  ) {
    throw new Error('approachCall must be prompt or fine_tune');
  }
  if (
    typeof record.economicsCall !== 'string' ||
    !ECONOMICS.has(record.economicsCall as FineTuningEconomics)
  ) {
    throw new Error('economicsCall must be prompt_wins or fine_tune_wins');
  }
  return {
    approachCall: record.approachCall as FineTuningApproach,
    economicsCall: record.economicsCall as FineTuningEconomics,
  };
}

export function parseF2Payload(payload: unknown): F2Payload {
  if (payload === null || typeof payload !== 'object') {
    throw new Error('Fine-tuning payload must be an object');
  }
  const record = payload as Record<string, unknown>;
  if (typeof record.issue !== 'string' || !ISSUES.has(record.issue as DatasetIssue)) {
    throw new Error('issue must be leakage, duplicate, label_noise, or format');
  }
  if (!Array.isArray(record.rowIds) || record.rowIds.some((id) => typeof id !== 'string')) {
    throw new Error('rowIds must be a string array');
  }
  return {
    issue: record.issue as DatasetIssue,
    rowIds: record.rowIds as string[],
  };
}

export function parseF4Payload(payload: unknown): F4Payload {
  if (payload === null || typeof payload !== 'object') {
    throw new Error('Fine-tuning payload must be an object');
  }
  const record = payload as Record<string, unknown>;
  if (
    typeof record.adapterChoice !== 'string' ||
    !ADAPTERS.has(record.adapterChoice as F4Payload['adapterChoice'])
  ) {
    throw new Error('adapterChoice is invalid');
  }
  if (
    typeof record.rationale !== 'string' ||
    !RATIONALES.has(record.rationale as F4Payload['rationale'])
  ) {
    throw new Error('rationale is invalid');
  }
  return {
    adapterChoice: record.adapterChoice as F4Payload['adapterChoice'],
    rationale: record.rationale as F4Payload['rationale'],
  };
}
