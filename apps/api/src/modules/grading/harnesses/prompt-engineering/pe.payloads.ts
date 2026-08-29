import type { P1Payload } from './pe.types';

export function parseP1Payload(payload: unknown): P1Payload {
  if (!payload || typeof payload !== 'object') {
    throw new Error('payload must be an object');
  }
  const record = payload as Record<string, unknown>;
  if (typeof record.systemPrompt !== 'string') {
    throw new Error('missing systemPrompt');
  }
  if (typeof record.fewShotBlock !== 'string') {
    throw new Error('missing fewShotBlock');
  }
  return {
    systemPrompt: record.systemPrompt,
    fewShotBlock: record.fewShotBlock,
  };
}
