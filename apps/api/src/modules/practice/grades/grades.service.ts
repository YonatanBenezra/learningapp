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
      failingCases: run.grade.failingCases,
    };
    if (JSON.stringify(grade).includes('HIDDEN_EVAL')) {
      return { ...grade, failingCases: [] };
    }
    return grade;
  }
}
