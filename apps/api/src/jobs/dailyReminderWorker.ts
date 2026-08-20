import { Worker } from 'bullmq';
import { QUEUE_NAMES, redisConnectionOptions, dailyReminderQueue } from './queue';
import { sendDailyReminders } from '../modules/notifications/notification.job';
import { logger } from '../common/utils/logger';

let worker: Worker | null = null;

export function startDailyReminderWorker(): void {
  worker = new Worker(
    QUEUE_NAMES.dailyReminder,
    async () => {
      await sendDailyReminders();
    },
    { connection: redisConnectionOptions() },
  );
  worker.on('failed', (job, err) => logger.error({ err, jobId: job?.id }, 'Daily reminder job failed'));
}

export async function stopDailyReminderWorker(): Promise<void> {
  await worker?.close();
  worker = null;
}

// Hourly repeatable job (idempotent by jobId). Runs hourly so each timezone's
// local day is covered; sendDailyReminders is idempotent per user per day.
export async function scheduleDailyReminders(): Promise<void> {
  await dailyReminderQueue().add(
    'remind',
    {},
    {
      repeat: { pattern: '0 * * * *' },
      jobId: 'daily-reminder-cron',
      removeOnComplete: true,
      removeOnFail: 100,
    },
  );
}
