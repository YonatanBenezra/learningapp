import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  R1_REFERENCE_PAYLOAD,
  R1_SLUG,
} from '../catalogue/exercises/exercises.constants';
import { BudgetExceededError } from '../grading/budget/budget-exceeded.error';
import { ModelGateway } from '../grading/gateway/model.gateway';
import { PINNED_GEN_MODEL } from '../grading/gateway/pricing';

@Injectable()
export class CostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: ModelGateway,
  ) {}

  async summary() {
    const [totals, killedBudget, genHits, judgeHits] = await Promise.all([
      this.prisma.run.aggregate({
        _count: true,
        _sum: { tokensIn: true, tokensOut: true, costEurMicros: true },
      }),
      this.prisma.run.count({ where: { status: 'killed_budget' } }),
      this.prisma.genCache.aggregate({ _sum: { hits: true }, _count: true }),
      this.prisma.judgeCache.aggregate({ _sum: { hits: true }, _count: true }),
    ]);
    return {
      model: PINNED_GEN_MODEL,
      fxRate: 1,
      runs: totals._count,
      killedBudget,
      tokensIn: totals._sum.tokensIn ?? 0,
      tokensOut: totals._sum.tokensOut ?? 0,
      costEurMicros: Number(totals._sum.costEurMicros ?? 0n),
      genCache: {
        entries: genHits._count,
        hits: genHits._sum.hits ?? 0,
      },
      judgeCache: {
        entries: judgeHits._count,
        hits: judgeHits._sum.hits ?? 0,
      },
    };
  }

  async fakeOverBudget(user: AuthenticatedUser) {
    const runId = await this.createProbeRun(user);
    try {
      await this.gateway.complete({
        runId,
        prompt: 'over-budget probe: this call must be killed',
      });
    } catch (error) {
      if (!(error instanceof BudgetExceededError)) {
        throw error;
      }
    }
    const run = await this.prisma.run.findUniqueOrThrow({
      where: { id: runId },
      select: {
        id: true,
        status: true,
        errorCode: true,
        errorMessage: true,
        tokensIn: true,
        tokensOut: true,
        costEurMicros: true,
      },
    });
    return {
      ...run,
      costEurMicros: Number(run.costEurMicros),
    };
  }

  private async createProbeRun(user: AuthenticatedUser): Promise<string> {
    const exercise = await this.prisma.exercise.findFirst({
      where: { slug: R1_SLUG, isPublished: true },
      orderBy: { version: 'desc' },
    });
    if (!exercise) {
      throw new Error('R1 is not seeded');
    }
    const created = await this.prisma.$transaction(async (tx) => {
      const attempt = await tx.attempt.create({
        data: {
          userId: user.id,
          exerciseId: exercise.id,
          exerciseVersion: exercise.version,
        },
      });
      const submission = await tx.submission.create({
        data: {
          attemptId: attempt.id,
          payload: { ...R1_REFERENCE_PAYLOAD },
          payloadHash: 'budget-probe',
        },
      });
      const run = await tx.run.create({
        data: {
          submissionId: submission.id,
          workerVersion: 'budget-probe',
          modelVersions: {},
          fxRate: new Prisma.Decimal(1),
          status: 'running',
          startedAt: new Date(),
        },
      });
      return run;
    });
    return created.id;
  }
}
