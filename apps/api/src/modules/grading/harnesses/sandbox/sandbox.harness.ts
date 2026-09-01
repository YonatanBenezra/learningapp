import { Injectable } from '@nestjs/common';
import { isSandboxRagSlug } from '../../../catalogue/exercises/exercises.constants';
import { SANDBOX_DEFAULTS } from '../../../sandbox/sandbox.constants';
import { SandboxService } from '../../../sandbox/sandbox.service';
import { BudgetEnforcer } from '../../budget/budget.enforcer';
import { parseBudget } from '../../budget/budget';
import type { CorpusDoc } from '../rag/chunking';
import type { HiddenItem } from '../rag/rag.types';
import { gradeSandboxRetriever } from './sandbox.grade';
import { parseSandboxPayload } from './sandbox.payloads';
import type { SandboxGradeResult } from './sandbox.types';

export type SandboxExecuteInput = {
  slug: string;
  runId: string;
  payload: unknown;
  docs: CorpusDoc[];
  hidden: HiddenItem[];
  publicItems?: { question: string }[];
  budget?: unknown;
};

@Injectable()
export class SandboxHarness {
  constructor(
    private readonly sandbox: SandboxService,
    private readonly budget: BudgetEnforcer,
  ) {}

  async execute(input: SandboxExecuteInput): Promise<SandboxGradeResult> {
    if (!isSandboxRagSlug(input.slug)) {
      throw new Error(`Unsupported sandbox exercise: ${input.slug}`);
    }
    await this.budget.assertWithinBudget(input.runId, {
      calls: 0,
      tokens: 0,
      costEurMicros: 0,
    });

    const parsedBudget = parseBudget(input.budget);
    const maxWallClockS = Math.min(
      parsedBudget.wallClockS ?? SANDBOX_DEFAULTS.maxWallClockS,
      SANDBOX_DEFAULTS.maxWallClockS,
    );
    const result = await gradeSandboxRetriever(
      parseSandboxPayload(input.payload),
      input.docs,
      input.hidden,
      input.publicItems ?? [],
      (job) => this.sandbox.run(job),
      { maxWallClockS },
    );

    await this.budget.recordSandbox(input.runId, {
      durationMs: result.trace.sandbox.durationMs,
      memoryPeakMb: result.trace.sandbox.memoryPeakMb,
      tokensIn: result.trace.tokensIn,
      tokensOut: result.trace.tokensOut,
      costEurMicros: result.trace.costEurMicros,
    });
    return result;
  }
}
