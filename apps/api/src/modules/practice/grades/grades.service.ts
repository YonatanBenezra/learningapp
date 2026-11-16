import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { PrismaService } from '../../../core/prisma/prisma.service';

export type PublicGrade = {
  verdict: string;
  metrics: unknown;
  gateResults: unknown;
  failureClasses: string[];
  scorecard: unknown;
  failingCases: unknown;
};

/**
 * Failing cases come from the hidden eval set. The question and what the
 * learner's system retrieved/produced are feedback; the gold labels are not.
 * Returning them lets a learner rebuild the hidden set over repeated submits.
 */
const HIDDEN_FAILING_CASE_FIELDS = new Set(['goldSpan', 'goldAnswer']);

export function redactFailingCases(failingCases: unknown): unknown {
  if (!Array.isArray(failingCases)) {
    return failingCases;
  }
  return failingCases.map((item: unknown) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return item;
    }
    return Object.fromEntries(
      Object.entries(item).filter(
        ([key]) => !HIDDEN_FAILING_CASE_FIELDS.has(key),
      ),
    );
  });
}

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  async getByRunId(
    user: AuthenticatedUser,
    runId: string,
  ): Promise<PublicGrade> {
    const run = await this.prisma.run.findFirst({
      where: { id: runId, submission: { attempt: { userId: user.id } } },
      include: { grade: true },
    });
    if (!run) {
      throw new NotFoundException('Run not found');
    }
    if (!run.grade) {
      throw new NotFoundException('Grade not ready');
    }
    const grade: PublicGrade = {
      verdict: run.grade.verdict,
      metrics: run.grade.metrics,
      gateResults: run.grade.gateResults,
      failureClasses: run.grade.failureClasses,
      scorecard: run.grade.scorecard,
      failingCases: redactFailingCases(run.grade.failingCases),
    };
    if (JSON.stringify(grade).includes('HIDDEN_EVAL')) {
      return { ...grade, failingCases: [] };
    }
    return grade;
  }
}
