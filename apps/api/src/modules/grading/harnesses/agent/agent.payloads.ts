import type { AgentPayload } from './agent.types';

export function parseAgentPayload(payload: unknown): AgentPayload {
  if (payload === null || typeof payload !== 'object') {
    throw new Error('Agent payload must be an object');
  }
  const record = payload as Record<string, unknown>;
  if (typeof record.source !== 'string' || record.source.trim().length === 0) {
    throw new Error('Agent payload is missing source');
  }
  return {
    source: record.source,
    systemPrompt:
      typeof record.systemPrompt === 'string' ? record.systemPrompt : '',
    toolSchemas: typeof record.toolSchemas === 'string' ? record.toolSchemas : '',
  };
}
