import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Exercise, Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import { QUEUE_GRADE } from '../../../common/constants/queues';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { hashToken } from '../../../common/utils/token-hash';
import {
  canonicalJson,
  validateJsonSchema,
  type JsonSchema,
} from '../../../common/validation/json-schema';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  GRADE_JOB_NAME,
  type GradeJobData,
} from '../../grading/processors/grade-job';
import { AccountService } from '../../accounts/account.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';

const UNASSIGNED_WORKER = 'unassigned';

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: AccountService,
    @InjectQueue(QUEUE_GRADE) private readonly gradeQueue: Queue<GradeJobData>,
  ) {}

  async create(
    user: AuthenticatedUser,
    attemptId: string,
    dto: CreateSubmissionDto,
  ) {
    const attempt = await this.prisma.attempt.findFirst({
      where: { id: attemptId, userId: user.id },
      include: { exercise: true },
    });
    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    const errors = validateJsonSchema(
      attempt.exercise.submissionSchema as JsonSchema,
      dto.payload,
    );
    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Invalid submission payload',
        errors,
      });
    }

    await assertAttemptPolicy(this.prisma, user.id, attempt.exercise);

    const payloadHash = hashToken(canonicalJson(dto.payload));
    const created = await this.prisma.$transaction(async (tx) => {
      const submission = await tx.submission.create({
        data: {
          attemptId: attempt.id,
          payload: dto.payload as Prisma.InputJsonValue,
          payloadHash,
        },
      });
      const run = await tx.run.create({
        data: {
          submissionId: submission.id,
          workerVersion: UNASSIGNED_WORKER,
          modelVersions: {},
          fxRate: new Prisma.Decimal(1),
          status: 'queued',
        },
      });
      await tx.attempt.update({
        where: { id: attempt.id },
        data: { status: 'submitted', submittedAt: new Date() },
      });
      await this.accounts.incrementOnSubmission(user.id, new Date(), tx);
      return { submission, run };
    });

    try {
      await this.gradeQueue.add(
        GRADE_JOB_NAME,
        { runId: created.run.id },
        { jobId: created.run.id, removeOnComplete: 1000, removeOnFail: 1000 },
      );
    } catch (error) {
      await this.prisma.run.update({
        where: { id: created.run.id },
        data: {
          status: 'failed',
          finishedAt: new Date(),
          errorCode: 'enqueue_failed',
          errorMessage: error instanceof Error ? error.message : 'unknown',
        },
      });
      throw error;
    }

    return {
      submissionId: created.submission.id,
      runId: created.run.id,
      status: created.run.status,
    };
  }
}

async function assertAttemptPolicy(
  prisma: PrismaService,
  userId: string,
  exercise: Exercise,
): Promise<void> {
  const policy =
    exercise.attemptPolicy && typeof exercise.attemptPolicy === 'object'
      ? (exercise.attemptPolicy as Record<string, unknown>)
      : null;
  const max =
    typeof policy?.maxSubmissions === 'number' ? policy.maxSubmissions : null;
  const hours =
    typeof policy?.cooldownHours === 'number' ? policy.cooldownHours : 24;
  if (max === null) {
    return;
  }
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const count = await prisma.submission.count({
    where: {
      createdAt: { gte: since },
      attempt: { userId, exerciseId: exercise.id },
    },
  });
  if (count >= max) {
    throw new HttpException(
      `Attempt policy: ${max} submissions then ${hours}h cooldown`,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
