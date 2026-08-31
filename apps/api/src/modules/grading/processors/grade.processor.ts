import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_GRADE } from '../../../common/constants/queues';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { BudgetExceededError } from '../budget/budget-exceeded.error';
import { GradingPipeline } from '../pipeline/grading.pipeline';
import { GRADE_JOB_NAME, WORKER_VERSION, type GradeJobData } from './grade-job';

@Processor(QUEUE_GRADE)
export class GradeProcessor extends WorkerHost {
  private readonly logger = new Logger(GradeProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pipeline: GradingPipeline,
  ) {
    super();
  }

  async process(job: Job<GradeJobData>): Promise<void> {
    if (job.name !== GRADE_JOB_NAME) {
      this.logger.warn(`Ignoring unexpected job name ${job.name}`);
      return;
    }
    const { runId } = job.data;
    try {
      await this.prisma.run.update({
        where: { id: runId },
        data: {
          status: 'running',
          startedAt: new Date(),
          workerVersion: WORKER_VERSION,
        },
      });
      await this.pipeline.run(runId);
    } catch (error) {
      if (error instanceof BudgetExceededError) {
        return;
      }
      const message = messageFromUnknown(error);
      await this.prisma.run
        .update({
          where: { id: runId },
          data: {
            status: 'failed',
            finishedAt: new Date(),
            errorCode: 'worker_error',
            errorMessage: message,
          },
        })
        .catch((updateError: unknown) => {
          this.logger.error(
            `Failed to mark run ${runId} as failed`,
            updateError instanceof Error ? updateError.stack : undefined,
          );
        });
      throw error;
    }
  }
}

function messageFromUnknown(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }
  return 'unknown';
}
