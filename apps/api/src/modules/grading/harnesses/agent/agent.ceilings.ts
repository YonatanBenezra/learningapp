import { AGENT_SANDBOX_DEFAULTS } from '../../../sandbox/sandbox.constants';
import type { AgentToolCall } from '../../../sandbox/sandbox.types';
import type { AgentTraceStep } from './agent.types';

export const KILLED_LOOP_MESSAGE =
  'Loop ceiling hit (max 8 steps / 12 tool calls). Stop after a tool error; do not repeat the same failing call.';

export const RECOVERY_FAIL_MESSAGE =
  'Retry once with different args after a tool error. Do not ignore the error or hammer the same call.';

export const BUDGET_EXCEEDED_MESSAGE =
  'Budget exceeded. Cut tokens or cost — wall-clock is information, not a pass gate.';

export const ORDER_FAIL_MESSAGE =
  'Plan the sequence: a successful calculator call must happen before json_store.';

export function callBudgetMessage(maxCalls: number): string {
  return `Call budget: at most ${maxCalls} tool calls. Deduplicate work and skip extras — wall-clock is not the gate.`;
}

const TIGHT_LOOP_STREAK = 3;
const SUMMARY_MAX = 80;

export type AgentLogInspection = {
  killedLoop: boolean;
  tightLoop: boolean;
  recovered: boolean;
  stepsUsed: number;
  toolCallsUsed: number;
  steps: AgentTraceStep[];
};

export function callFingerprint(call: {
  name: string;
  args: Record<string, unknown>;
}): string {
  return `${call.name}:${stableArgs(call.args)}`;
}

export function inspectAgentLog(
  log: AgentToolCall[],
  limits: {
    maxSteps?: number;
    maxToolCalls?: number;
  } = {},
): AgentLogInspection {
  const maxSteps = limits.maxSteps ?? AGENT_SANDBOX_DEFAULTS.maxSteps;
  const maxToolCalls =
    limits.maxToolCalls ?? AGENT_SANDBOX_DEFAULTS.maxToolCalls;
  const real = log.filter((call) => call.error !== 'killed_loop');
  const killedLoop =
    log.some((call) => call.error === 'killed_loop') ||
    real.length > maxSteps ||
    log.length > maxToolCalls;
  return {
    killedLoop,
    tightLoop: hasTightLoop(log),
    recovered: hasRecovered(log),
    stepsUsed: real.length,
    toolCallsUsed: real.length,
    steps: toTraceSteps(log),
  };
}

export function argsSummary(
  name: string,
  args: Record<string, unknown>,
): string {
  const keys =
    name === 'json_store'
      ? Object.keys(args).filter((key) => key !== 'value')
      : Object.keys(args);
  const parts = keys.map((key) => `${key}=${clip(stringify(args[key]))}`);
  return sanitize(parts.join(' '));
}

export function resultBytesOf(call: AgentToolCall): number {
  if (typeof call.resultBytes === 'number' && Number.isFinite(call.resultBytes)) {
    return call.resultBytes;
  }
  if (call.error) {
    return byteLength(call.error);
  }
  if (call.result !== undefined) {
    return byteLength(stringify(call.result));
  }
  return 0;
}

function toTraceSteps(log: AgentToolCall[]): AgentTraceStep[] {
  return log.map((call, index) => {
    const error =
      typeof call.error === 'string' ? sanitize(call.error) : undefined;
    const step: AgentTraceStep = {
      index: index + 1,
      kind: 'tool',
      name: call.name,
      argsSummary: argsSummary(call.name, call.args),
      resultBytes: resultBytesOf(call),
      durationMs: call.durationMs,
      ok: call.ok,
    };
    if (error) {
      step.error = error === 'killed_loop' ? 'killed_loop' : clip(error);
    }
    return step;
  });
}

function hasTightLoop(log: AgentToolCall[]): boolean {
  let streak = 0;
  let last = '';
  for (const call of log) {
    if (call.error === 'killed_loop') {
      return streak >= 2;
    }
    if (call.ok) {
      streak = 0;
      last = '';
      continue;
    }
    const finger = callFingerprint(call);
    if (finger === last) {
      streak += 1;
    } else {
      streak = 1;
      last = finger;
    }
    if (streak >= TIGHT_LOOP_STREAK) {
      return true;
    }
  }
  return false;
}

function hasRecovered(log: AgentToolCall[]): boolean {
  for (let index = 0; index < log.length; index += 1) {
    const failed = log[index];
    if (!failed || failed.ok || failed.error === 'killed_loop') {
      continue;
    }
    const finger = callFingerprint(failed);
    for (let later = index + 1; later < log.length; later += 1) {
      const next = log[later];
      if (
        next &&
        next.ok &&
        next.name === failed.name &&
        callFingerprint(next) !== finger
      ) {
        return true;
      }
    }
  }
  return false;
}

function stableArgs(args: Record<string, unknown>): string {
  const keys = Object.keys(args).sort();
  const ordered: Record<string, unknown> = {};
  for (const key of keys) {
    ordered[key] = args[key];
  }
  return stringify(ordered);
}

function stringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function clip(value: string): string {
  if (value.length <= SUMMARY_MAX) {
    return value;
  }
  return `${value.slice(0, SUMMARY_MAX)}…`;
}

function sanitize(value: string): string {
  return value.includes('HIDDEN_EVAL') ? '[redacted]' : value;
}

function byteLength(value: string): number {
  return Buffer.byteLength(value, 'utf8');
}
