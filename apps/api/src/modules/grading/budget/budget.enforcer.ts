import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { BudgetExceededError } from './budget-exceeded.error';
import {
  breachReason,
  parseBudget,
  type BudgetDelta,
  type BudgetUsage,
  type ExerciseBudget,
} from './budget';

type MeteredRun = {
  id: string;
  tokensIn: number;
  tokensOut: number;
  costEurMicros: bigint;
  modelVersions: Prisma.JsonValue;
  startedAt: Date | null;
  budget: ExerciseBudget;
};

@Injectable()
export class BudgetEnforcer {
  private readonly logger = new Logger(BudgetEnforcer.name);

  constructor(private readonly prisma: PrismaService) {}

  async load(runId: string): Promise<MeteredRun> {
    const run = await this.prisma.run.findUniqueOrThrow({
      where: { id: runId },
      include: {
        submission: { include: { attempt: { include: { exercise: true } } } },
      },
    });
    return {
      id: run.id,
      tokensIn: run.tokensIn,
      tokensOut: run.tokensOut,
      costEurMicros: run.costEurMicros,
      modelVersions: run.modelVersions,
      startedAt: run.startedAt,
      budget: parseBudget(run.submission.attempt.exercise.budget),
    };
  }

  usage(run: MeteredRun): BudgetUsage {
    const versions = asRecord(run.modelVersions);
    return {
      calls: numberField(versions.calls),
      tokens: run.tokensIn + run.tokensOut,
      costEurMicros: Number(run.costEurMicros),
      startedAt: run.startedAt,
    };
  }

  async assertWithinBudget(
    runId: string,
    extra: BudgetDelta,
    options: { ignoreWallClock?: boolean } = {},
  ): Promise<void> {
    const run = await this.load(runId);
    const reason = breachReason(
      run.budget,
      this.usage(run),
      extra,
      new Date(),
      options,
    );
    if (reason) {
      await this.kill(runId, reason);
      throw new BudgetExceededError(runId, reason);
    }
  }

  async recordSandbox(
    runId: string,
    usage: {
      durationMs: number;
      memoryPeakMb: number | null;
      tokensIn: number;
      tokensOut: number;
      costEurMicros: number;
    },
    options: { countWallClock?: boolean } = {},
  ): Promise<void> {
    const ignoreWallClock = options.countWallClock === false;
    await this.assertWithinBudget(
      runId,
      {
        calls: 0,
        tokens: usage.tokensIn + usage.tokensOut,
        costEurMicros: usage.costEurMicros,
        ...(ignoreWallClock ? {} : { sandboxMs: usage.durationMs }),
      },
      { ignoreWallClock },
    );
    const run = await this.prisma.run.findUniqueOrThrow({
      where: { id: runId },
    });
    const versions = asRecord(run.modelVersions);
    await this.prisma.run.update({
      where: { id: runId },
      data: {
        tokensIn: run.tokensIn + usage.tokensIn,
        tokensOut: run.tokensOut + usage.tokensOut,
        costEurMicros: run.costEurMicros + BigInt(usage.costEurMicros),
        modelVersions: {
          ...versions,
          sandboxMs: usage.durationMs,
          sandboxMemoryPeakMb: usage.memoryPeakMb,
        },
      },
    });
  }

  async kill(runId: string, reason: string): Promise<void> {
    this.logger.warn(`Run ${runId} killed_budget: ${reason}`);
    await this.prisma.run.update({
      where: { id: runId },
      data: {
        status: 'killed_budget',
        finishedAt: new Date(),
        errorCode: 'budget_exceeded',
        errorMessage: `Budget exceeded (${reason}). Cut tokens or cost — wall-clock is information, not a pass gate.`,
      },
    });
  }
}

export function asRecord(value: Prisma.JsonValue): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...value };
  }
  return {};
}

export function numberField(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
