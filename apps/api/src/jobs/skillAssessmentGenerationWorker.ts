import { Worker, type Job } from 'bullmq';
import { QUEUE_NAMES, redisConnectionOptions } from './queue';
import { runSkillAssessmentGeneration } from '../modules/assessments/skillAssessment.service';
import { logger } from '../common/utils/logger';

let worker: Worker | null = null;

export function startSkillAssessmentGenerationWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(
    QUEUE_NAMES.skillAssessmentGeneration,
    async (job: Job<{ assessmentId: string }>) => {
      await runSkillAssessmentGeneration(job.data.assessmentId);
    },
    { connection: redisConnectionOptions() },
  );
  worker.on('completed', (job) =>
    logger.info({ jobId: job.id }, 'Skill assessment generation job completed'),
  );
  worker.on('failed', (job, err) =>
    logger.error({ err, jobId: job?.id }, 'Skill assessment generation job failed'),
  );
  logger.info('Skill assessment generation worker started');
  return worker;
}

export async function stopSkillAssessmentGenerationWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
}
