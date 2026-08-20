import { Worker } from 'bullmq';
import { QUEUE_NAMES, redisConnectionOptions, streakResetQueue } from './queue';
import { resetStaleStreaks } from '../modules/gamification/streak.service';
import { logger } from '../common/utils/logger';

let worker: Worker | null = null;

export function startStreakResetWorker(): void {
  worker = new Worker(
    QUEUE_NAMES.streakReset,
    async () => {
      await resetStaleStreaks();
    },
    { connection: redisConnectionOptions() },
  );
  worker.on('failed', (job, err) => logger.error({ err, jobId: job?.id }, 'Streak reset job failed'));
}

export async function stopStreakResetWorker(): Promise<void> {
  await worker?.close();
  worker = null;
}

// Registers the repeatable job (idempotent by jobId). Runs hourly so every
// timezone's local midnight is covered within the hour; resetStaleStreaks itself
// is idempotent, so extra runs are harmless.
export async function scheduleStreakReset(): Promise<void> {
  await streakResetQueue().add(
    'reset',
    {},
    {
      repeat: { pattern: '0 * * * *' },
      jobId: 'streak-reset-cron',
      removeOnComplete: true,
      removeOnFail: 100,
    },
  );
}
