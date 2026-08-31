import type {
  AgentToolCall,
  SandboxJobInput,
  SandboxJobResult,
} from '../../../sandbox/sandbox.types';
import { SANDBOX_ERROR_CODES } from '../../../sandbox/sandbox.constants';
import { agentWorkspaceFiles } from './agent.input';
import {
  callBudgetMessage,
  inspectAgentLog,
  KILLED_LOOP_MESSAGE,
  ORDER_FAIL_MESSAGE,
  RECOVERY_FAIL_MESSAGE,
} from './agent.ceilings';
import { buildAgentTrace } from './agent.trace';
import type {
  AgentGradeResult,
  AgentItem,
  AgentPayload,
} from './agent.types';
import { isAgentCanary } from './agent.types';

const TOOL_HIT = 1;

export type AgentGradeOptions = {
  requireRecovery?: boolean;
  maxCalls?: number;
  requireCalcBeforeStore?: boolean;
};

export type AgentExecutor = (
  input: SandboxJobInput,
) => Promise<SandboxJobResult>;

export async function gradeAgent(
  payload: AgentPayload,
  hidden: AgentItem[],
  publicItems: { question: string }[],
  execute: AgentExecutor,
  limits?: { maxWallClockS?: number; maxMemoryMb?: number },
  options: AgentGradeOptions = {},
): Promise<AgentGradeResult> {
  const usable = hidden.filter((item) => !isAgentCanary(item));
  const executed = await execute({
    source: payload.source,
    workspaceFiles: agentWorkspaceFiles(hidden, payload),
    maxWallClockS: limits?.maxWallClockS,
    maxMemoryMb: limits?.maxMemoryMb,
  });
  return finishAgentGrade({
    payload,
    executed,
    usable,
    publicItems,
    requireRecovery: options.requireRecovery === true,
    maxCalls: options.maxCalls,
    requireCalcBeforeStore: options.requireCalcBeforeStore === true,
  });
}

export async function gradeA1(
  payload: AgentPayload,
  hidden: AgentItem[],
  publicItems: { question: string }[],
  execute: AgentExecutor,
  limits?: { maxWallClockS?: number; maxMemoryMb?: number },
): Promise<AgentGradeResult> {
  return gradeAgent(payload, hidden, publicItems, execute, limits);
}

export function finishAgentGrade(input: {
  payload: AgentPayload;
  executed: SandboxJobResult;
  usable: AgentItem[];
  publicItems: { question: string }[];
  requireRecovery: boolean;
  maxCalls?: number;
  requireCalcBeforeStore?: boolean;
}): AgentGradeResult {
  const leaked = dumpsContainCanary(input.executed);
  const log = input.executed.toolLog ?? [];
  const inspection = inspectAgentLog(log);
  const hits: boolean[] = [];
  const misses: AgentGradeResult['failingCases'] = [];
  for (const item of input.usable) {
    const hit = log.some((call) => callMatches(call, item));
    hits.push(hit);
    if (!hit && misses.length < 4) {
      misses.push({
        question: item.id,
        note: `expected ${item.gold.tool}`,
      });
    }
  }

  const hitCount = hits.filter(Boolean).length;
  const rate =
    input.usable.length === 0 ? 0 : hitCount / input.usable.length;
  const loopPass = !inspection.killedLoop;
  const recoveryPass = input.requireRecovery
    ? inspection.recovered && !inspection.tightLoop
    : true;
  const budgetPass =
    input.maxCalls === undefined || inspection.stepsUsed <= input.maxCalls;
  const orderPass = input.requireCalcBeforeStore
    ? calcBeforeStore(log)
    : true;
  const canaryPass = !leaked;
  const sandboxFailure = inspection.killedLoop
    ? 'killed_loop'
    : input.executed.ok
      ? undefined
      : input.executed.errorCode === SANDBOX_ERROR_CODES.OK
        ? 'sandbox_runtime_error'
        : input.executed.errorCode;
  const passed =
    canaryPass &&
    loopPass &&
    recoveryPass &&
    budgetPass &&
    orderPass &&
    sandboxFailure === undefined &&
    rate >= TOOL_HIT;

  const failureClasses = passed
    ? []
    : [
        ...(sandboxFailure ? [sandboxFailure] : []),
        ...(loopPass ? [] : ['killed_loop']),
        ...(recoveryPass ? [] : ['no-recovery']),
        ...(budgetPass ? [] : ['call-budget']),
        ...(orderPass ? [] : ['wrong-order']),
        ...(rate >= TOOL_HIT || !loopPass || sandboxFailure
          ? []
          : ['wrong-tool']),
        ...(canaryPass ? [] : ['canary-leak']),
      ];
  const uniqueFailures = [...new Set(failureClasses)];

  const failingCases = leaked
    ? [{ question: 'canary', note: 'canary-leak' }]
    : !loopPass
      ? [{ question: 'loop', note: KILLED_LOOP_MESSAGE }]
      : !recoveryPass
        ? [{ question: 'recovery', note: RECOVERY_FAIL_MESSAGE }]
        : !budgetPass && input.maxCalls !== undefined
          ? [{ question: 'budget', note: callBudgetMessage(input.maxCalls) }]
          : !orderPass
            ? [{ question: 'order', note: ORDER_FAIL_MESSAGE }]
            : misses;

  const result: AgentGradeResult = {
    verdict: passed ? 'pass' : 'fail',
    metrics: {
      tool_hits: {
        value: rate,
        hits: Math.round(rate * input.usable.length),
        total: input.usable.length,
      },
      no_canary: { value: canaryPass ? 1 : 0 },
      loop_ok: { value: loopPass ? 1 : 0 },
      recovered: { value: inspection.recovered ? 1 : 0 },
      call_budget: {
        value: budgetPass ? 1 : 0,
        hits: inspection.stepsUsed,
        total: input.maxCalls ?? inspection.stepsUsed,
      },
      calc_before_store: { value: orderPass ? 1 : 0 },
    },
    gateResults: [
      {
        id: 'tool-hits',
        class: 'A',
        metric: 'tool_hits',
        op: 'gte',
        value: TOOL_HIT,
        actual: rate,
        passed: rate >= TOOL_HIT && sandboxFailure === undefined,
      },
      {
        id: 'no-canary',
        class: 'A',
        metric: 'no_canary',
        op: 'eq',
        value: 1,
        actual: canaryPass ? 1 : 0,
        passed: canaryPass,
      },
      {
        id: 'loop-ceiling',
        class: 'A',
        metric: 'loop_ok',
        op: 'eq',
        value: 1,
        actual: loopPass ? 1 : 0,
        passed: loopPass,
      },
      ...(input.requireRecovery
        ? [
            {
              id: 'error-recovery',
              class: 'A' as const,
              metric: 'recovered',
              op: 'eq',
              value: 1,
              actual: inspection.recovered && !inspection.tightLoop ? 1 : 0,
              passed: recoveryPass,
            },
          ]
        : []),
      ...(input.maxCalls !== undefined
        ? [
            {
              id: 'call-budget',
              class: 'A' as const,
              metric: 'call_budget',
              op: 'lte',
              value: input.maxCalls,
              actual: inspection.stepsUsed,
              passed: budgetPass,
            },
          ]
        : []),
      ...(input.requireCalcBeforeStore
        ? [
            {
              id: 'calc-before-store',
              class: 'A' as const,
              metric: 'calc_before_store',
              op: 'eq',
              value: 1,
              actual: orderPass ? 1 : 0,
              passed: orderPass,
            },
          ]
        : []),
    ],
    failureClasses: uniqueFailures,
    scorecard: {
      toolHits: rate,
      steps: inspection.steps.map((step) => step.name),
      durationMs: input.executed.durationMs,
      memoryPeakMb: input.executed.memoryPeakMb,
      wallClock: 'information',
      ...(loopPass ? {} : { message: KILLED_LOOP_MESSAGE }),
      ...(recoveryPass ? {} : { message: RECOVERY_FAIL_MESSAGE }),
      ...(!budgetPass && input.maxCalls !== undefined
        ? { message: callBudgetMessage(input.maxCalls) }
        : {}),
      ...(orderPass ? {} : { message: ORDER_FAIL_MESSAGE }),
      ...(sandboxFailure ? { sandboxError: sandboxFailure } : {}),
    },
    failingCases,
    trace: buildAgentTrace({
      payload: input.payload,
      executed: input.executed,
      publicItems: input.publicItems,
      inspection,
    }),
  };

  if (JSON.stringify(result).includes('HIDDEN_EVAL')) {
    return {
      ...result,
      verdict: 'fail',
      failureClasses: [...new Set([...result.failureClasses, 'canary-leak'])],
      failingCases: [{ question: 'canary', note: 'canary-leak' }],
      metrics: {
        ...result.metrics,
        no_canary: { value: 0 },
      },
    };
  }
  return result;
}

function callMatches(call: AgentToolCall, item: AgentItem): boolean {
  if (!call.ok || call.name !== item.gold.tool) {
    return false;
  }
  const expected = item.gold.args ?? {};
  for (const [key, value] of Object.entries(expected)) {
    if (!Object.is(call.args[key], value) && call.args[key] !== value) {
      return false;
    }
  }
  return true;
}

function calcBeforeStore(log: AgentToolCall[]): boolean {
  const calc = log.findIndex(
    (call) => call.ok && call.name === 'calculator',
  );
  const store = log.findIndex(
    (call) => call.ok && call.name === 'json_store',
  );
  return calc !== -1 && store !== -1 && calc < store;
}

function dumpsContainCanary(executed: SandboxJobResult): boolean {
  return JSON.stringify({
    stdout: executed.stdout,
    stderr: executed.stderr,
    toolLog: executed.toolLog ?? [],
  }).includes('HIDDEN_EVAL');
}
