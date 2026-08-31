import { Injectable } from '@nestjs/common';
import { AGENT_SANDBOX_DEFAULTS } from '../../../sandbox/sandbox.constants';
import { SandboxService } from '../../../sandbox/sandbox.service';
import { BudgetEnforcer } from '../../budget/budget.enforcer';
import { parseBudget } from '../../budget/budget';
import { gradeAgent } from './a1.grade';
import { agentGradeOptions, isAgentExerciseSlug } from './agent.options';
import { parseAgentPayload } from './agent.payloads';
import type { AgentGradeResult, AgentItem } from './agent.types';

export type AgentExecuteInput = {
  slug: string;
  runId: string;
  payload: unknown;
  hidden: AgentItem[];
  publicItems?: { question: string }[];
  budget?: unknown;
};

@Injectable()
export class AgentHarness {
  constructor(
    private readonly sandbox: SandboxService,
    private readonly budget: BudgetEnforcer,
  ) {}

  async execute(input: AgentExecuteInput): Promise<AgentGradeResult> {
    if (!isAgentExerciseSlug(input.slug)) {
      throw new Error(`Unsupported agent exercise: ${input.slug}`);
    }
    await this.budget.assertWithinBudget(
      input.runId,
      {
        calls: 0,
        tokens: 0,
        costEurMicros: 0,
      },
      { ignoreWallClock: true },
    );

    const parsedBudget = parseBudget(input.budget);
    const maxWallClockS = Math.min(
      parsedBudget.wallClockS ?? AGENT_SANDBOX_DEFAULTS.maxWallClockS,
      AGENT_SANDBOX_DEFAULTS.maxWallClockS,
    );
    const result = await gradeAgent(
      parseAgentPayload(input.payload),
      input.hidden,
      input.publicItems ?? [],
      (job) => this.sandbox.runAgent(job),
      {
        maxWallClockS,
        maxMemoryMb: AGENT_SANDBOX_DEFAULTS.maxMemoryMb,
      },
      agentGradeOptions(input.slug),
    );

    await this.budget.recordSandbox(
      input.runId,
      {
        durationMs: result.trace.sandbox.durationMs,
        memoryPeakMb: result.trace.sandbox.memoryPeakMb,
        tokensIn: result.trace.tokensIn,
        tokensOut: result.trace.tokensOut,
        costEurMicros: result.trace.costEurMicros,
      },
      { countWallClock: false },
    );
    return result;
  }
}
