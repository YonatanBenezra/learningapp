import { Worker } from 'bullmq';
import { QUEUE_NAMES, redisConnectionOptions, accountPurgeQueue } from './queue';
import { purgeDeletedUsers } from '../modules/privacy/privacy.service';
import { logger } from '../common/utils/logger';

let worker: Worker | null = null;

export function startAccountPurgeWorker(): void {
  worker = new Worker(
    QUEUE_NAMES.accountPurge,
    async () => {
      await purgeDeletedUsers();
    },
    { connection: redisConnectionOptions() },
  );
  worker.on('failed', (job, err) => logger.error({ err, jobId: job?.id }, 'Account purge job failed'));
}

export async function stopAccountPurgeWorker(): Promise<void> {
  await worker?.close();
  worker = null;
}

// Daily repeatable job (idempotent by jobId). Hard-deletes accounts past the
// soft-delete retention window (§12).
export async function scheduleAccountPurge(): Promise<void> {
  await accountPurgeQueue().add(
    'purge',
    {},
    {
      repeat: { pattern: '0 3 * * *' }, // 03:00 daily
      jobId: 'account-purge-cron',
      removeOnComplete: true,
      removeOnFail: 100,
    },
  );
}
