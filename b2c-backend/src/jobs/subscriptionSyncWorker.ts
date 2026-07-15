import { Worker } from 'bullmq';
import { QUEUE_NAMES, redisConnectionOptions, subscriptionSyncQueue } from './queue';
import { reconcileSubscriptions } from '../modules/subscriptions/subscription.service';
import { logger } from '../common/utils/logger';

let worker: Worker | null = null;

export function startSubscriptionSyncWorker(): void {
  worker = new Worker(
    QUEUE_NAMES.subscriptionSync,
    async () => {
      await reconcileSubscriptions();
    },
    { connection: redisConnectionOptions() },
  );
  worker.on('failed', (job, err) =>
    logger.error({ err, jobId: job?.id }, 'Subscription sync job failed'),
  );
}

export async function stopSubscriptionSyncWorker(): Promise<void> {
  await worker?.close();
  worker = null;
}

// Daily reconciliation of Stripe ↔ DB (idempotent). Runs at 02:00.
export async function scheduleSubscriptionSync(): Promise<void> {
  await subscriptionSyncQueue().add(
    'sync',
    {},
    {
      repeat: { pattern: '0 2 * * *' },
      jobId: 'subscription-sync-cron',
      removeOnComplete: true,
      removeOnFail: 100,
    },
  );
}
