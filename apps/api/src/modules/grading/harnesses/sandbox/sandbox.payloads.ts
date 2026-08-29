export type SandboxPayload = {
  source: string;
};

export function parseSandboxPayload(payload: unknown): SandboxPayload {
  if (payload === null || typeof payload !== 'object') {
    throw new Error('Sandbox payload must be an object');
  }
  const record = payload as Record<string, unknown>;
  if (typeof record.source !== 'string' || record.source.trim().length === 0) {
    throw new Error('Sandbox payload is missing source');
  }
  return { source: record.source };
}
