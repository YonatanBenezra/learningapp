import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { AGENT_SANDBOX_DEFAULTS } from './sandbox.constants';
import type { AgentToolCall, SandboxRuntimeConfig } from './sandbox.types';

export const AGENT_TOOL_LOG_MARKER = 'LABPATH_TOOL_LOG:';

export function sandboxToolsPythonPath(): string {
  return path.resolve(process.cwd(), '../../infra/sandbox/python');
}

export function withAgentEnvelope(
  config: SandboxRuntimeConfig,
): SandboxRuntimeConfig {
  return {
    ...config,
    maxMemoryMb: AGENT_SANDBOX_DEFAULTS.maxMemoryMb,
    maxWallClockS: AGENT_SANDBOX_DEFAULTS.maxWallClockS,
  };
}

export function parseAgentToolLog(raw: string): AgentToolCall[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    const allowed = new Set<string>(AGENT_SANDBOX_DEFAULTS.tools);
    const calls: AgentToolCall[] = [];
    for (const row of parsed) {
      if (!row || typeof row !== 'object') {
        continue;
      }
      const record = row as Record<string, unknown>;
      if (typeof record.name !== 'string' || !allowed.has(record.name)) {
        continue;
      }
      if (typeof record.ok !== 'boolean') {
        continue;
      }
      const durationMs =
        typeof record.durationMs === 'number' &&
        Number.isFinite(record.durationMs)
          ? record.durationMs
          : 0;
      const args =
        record.args &&
        typeof record.args === 'object' &&
        !Array.isArray(record.args)
          ? (record.args as Record<string, unknown>)
          : {};
      const call: AgentToolCall = {
        name: record.name,
        args,
        ok: record.ok,
        durationMs,
      };
      if (typeof record.error === 'string') {
        call.error = record.error;
      }
      if (record.result !== undefined) {
        call.result = record.result;
      }
      if (
        typeof record.resultBytes === 'number' &&
        Number.isFinite(record.resultBytes)
      ) {
        call.resultBytes = record.resultBytes;
      }
      calls.push(call);
    }
    return calls;
  } catch {
    return [];
  }
}

export function splitToolLogStderr(stderr: string): {
  stderr: string;
  toolLog: AgentToolCall[];
} {
  const kept: string[] = [];
  let last = '';
  for (const line of stderr.split('\n')) {
    if (line.startsWith(AGENT_TOOL_LOG_MARKER)) {
      last = line.slice(AGENT_TOOL_LOG_MARKER.length);
    } else {
      kept.push(line);
    }
  }
  return {
    stderr: kept.join('\n'),
    toolLog: last ? parseAgentToolLog(last) : [],
  };
}

export async function readToolLogFile(
  filePath: string,
): Promise<AgentToolCall[]> {
  try {
    return parseAgentToolLog(await readFile(filePath, 'utf8'));
  } catch {
    return [];
  }
}
