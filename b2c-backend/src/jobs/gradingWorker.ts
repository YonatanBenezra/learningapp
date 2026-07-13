import { Worker, type Job } from 'bullmq';
import { QUEUE_NAMES, redisConnectionOptions } from './queue';
import { gradeExerciseSubmission } from '../modules/exercises/grading.service';
import { logger } from '../common/utils/logger';

// Async processor for exercise grading (§8). Consumes the grading queue and
// delegates to the domain logic in exercises/grading.service.
let worker: Worker | null = null;

export function startGradingWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(
    QUEUE_NAMES.grading,
    async (job: Job<{ submissionId: string }>) => {
      await gradeExerciseSubmission(job.data.submissionId);
    },
    { connection: redisConnectionOptions() },
  );
  worker.on('completed', (job) => logger.info({ jobId: job.id }, 'Grading job completed'));
  worker.on('failed', (job, err) => logger.error({ err, jobId: job?.id }, 'Grading job failed'));
  logger.info('Grading worker started');
  return worker;
}

export async function stopGradingWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
}
