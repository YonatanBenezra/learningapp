import {
  Injectable,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { PrismaService } from '../../../core/prisma/prisma.service';

@Injectable()
export class RunsService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(user: AuthenticatedUser, id: string) {
    const run = await this.prisma.run.findFirst({
      where: { id, submission: { attempt: { userId: user.id } } },
      select: {
        id: true,
        status: true,
        createdAt: true,
        startedAt: true,
        finishedAt: true,
        errorCode: true,
        errorMessage: true,
        tokensIn: true,
        tokensOut: true,
        costEurMicros: true,
        submission: {
          select: {
            attempt: {
              select: { exercise: { select: { slug: true, title: true } } },
            },
          },
        },
      },
    });
    if (!run) {
      throw new NotFoundException('Run not found');
    }
    return {
      id: run.id,
      status: run.status,
      createdAt: run.createdAt,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      errorCode: run.errorCode,
      errorMessage: run.errorMessage,
      tokensIn: run.tokensIn,
      tokensOut: run.tokensOut,
      costEurMicros: Number(run.costEurMicros),
      exerciseSlug: run.submission.attempt.exercise.slug,
      title: run.submission.attempt.exercise.title,
    };
  }

  stream(id: string): never {
    void id;
    throw new NotImplementedException();
  }
}
