import type { SandboxJobResult } from '../../../sandbox/sandbox.types';
import { AGENT_SANDBOX_DEFAULTS } from '../../../sandbox/sandbox.constants';
import type { AgentLogInspection } from './agent.ceilings';
import type { AgentGradeResult, AgentPayload } from './agent.types';

export function buildAgentTrace(input: {
  payload: AgentPayload;
  executed: SandboxJobResult;
  publicItems: { question: string }[];
  inspection: AgentLogInspection;
}): AgentGradeResult['trace'] {
  return {
    simulator: 'agent',
    execution: 'sandbox',
    payload: { sourceBytes: input.payload.source.length },
    sandbox: {
      durationMs: input.executed.durationMs,
      memoryPeakMb: input.executed.memoryPeakMb,
      errorCode: input.executed.errorCode,
      exitCode: input.executed.exitCode,
      runtime: input.executed.runtime,
    },
    steps: input.inspection.steps,
    ceilings: {
      maxSteps: AGENT_SANDBOX_DEFAULTS.maxSteps,
      maxToolCalls: AGENT_SANDBOX_DEFAULTS.maxToolCalls,
      stepsUsed: input.inspection.stepsUsed,
      toolCallsUsed: input.inspection.toolCallsUsed,
      killedLoop: input.inspection.killedLoop,
    },
    k: 0,
    chunkCount: 0,
    tokensIn: 0,
    tokensOut: 0,
    costEurMicros: 0,
    queries: input.publicItems.slice(0, 2).map((item, index) => ({
      source: 'public' as const,
      question: item.question,
      retrieved: [
        {
          chunkId: `public-${index}`,
          docId: 'task',
          score: 1,
          text: item.question.slice(0, 160),
        },
      ],
    })),
  };
}
