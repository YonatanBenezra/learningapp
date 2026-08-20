import { Worker, type Job } from 'bullmq';
import { QUEUE_NAMES, redisConnectionOptions } from './queue';
import { runCourseGeneration } from '../modules/courses/course.service';
import { logger } from '../common/utils/logger';

// Async processor for Course->Module->Lesson generation (§8). Consumes the
// course-generation queue and delegates to the domain logic in course.service.
let worker: Worker | null = null;

export function startCourseGenerationWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(
    QUEUE_NAMES.courseGeneration,
    async (job: Job<{ courseId: string }>) => {
      await runCourseGeneration(job.data.courseId);
    },
    { connection: redisConnectionOptions() },
  );
  worker.on('completed', (job) => logger.info({ jobId: job.id }, 'Course generation job completed'));
  worker.on('failed', (job, err) =>
    logger.error({ err, jobId: job?.id }, 'Course generation job failed'),
  );
  logger.info('Course generation worker started');
  return worker;
}

export async function stopCourseGenerationWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
}
