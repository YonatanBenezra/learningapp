import { createServer } from 'node:http';
import { app } from './app';
import { env } from './config/env';
import { connectDB, disconnectDB, ensureIndexes } from './config/db';
import { redis } from './config/redis';
import { closeQueues } from './jobs/queue';
import {
  startCourseGenerationWorker,
  stopCourseGenerationWorker,
} from './jobs/courseGenerationWorker';
import { startGradingWorker, stopGradingWorker } from './jobs/gradingWorker';
import {
  startStreakResetWorker,
  stopStreakResetWorker,
  scheduleStreakReset,
} from './jobs/streakResetWorker';
import {
  startDailyReminderWorker,
  stopDailyReminderWorker,
  scheduleDailyReminders,
} from './jobs/dailyReminderWorker';
import {
  startAccountPurgeWorker,
  stopAccountPurgeWorker,
  scheduleAccountPurge,
} from './jobs/accountPurgeWorker';
import {
  startSubscriptionSyncWorker,
  stopSubscriptionSyncWorker,
  scheduleSubscriptionSync,
} from './jobs/subscriptionSyncWorker';
import { seedAchievements } from './modules/gamification/gamification.service';
import { initSentry } from './common/observability/sentry';
import { logger } from './common/utils/logger';

async function bootstrap(): Promise<void> {
  initSentry();
  await connectDB();
  await ensureIndexes();
  await seedAchievements();
  await redis.connect();
  logger.info('Redis connected');

  startCourseGenerationWorker();
  startGradingWorker();
  startStreakResetWorker();
  await scheduleStreakReset();
  startDailyReminderWorker();
  await scheduleDailyReminders();
  startAccountPurgeWorker();
  await scheduleAccountPurge();
  startSubscriptionSyncWorker();
  await scheduleSubscriptionSync();

  const server = createServer(app);
  server.listen(env.port, () => logger.info(`b2c-backend listening on :${env.port}`));

  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} received — shutting down`);
    server.close();
    await stopCourseGenerationWorker().catch((err) =>
      logger.error({ err }, 'Error stopping course worker'),
    );
    await stopGradingWorker().catch((err) => logger.error({ err }, 'Error stopping grading worker'));
    await stopStreakResetWorker().catch((err) =>
      logger.error({ err }, 'Error stopping streak-reset worker'),
    );
    await stopDailyReminderWorker().catch((err) =>
      logger.error({ err }, 'Error stopping daily-reminder worker'),
    );
    await stopAccountPurgeWorker().catch((err) =>
      logger.error({ err }, 'Error stopping account-purge worker'),
    );
    await stopSubscriptionSyncWorker().catch((err) =>
      logger.error({ err }, 'Error stopping subscription-sync worker'),
    );
    await closeQueues().catch((err) => logger.error({ err }, 'Error closing queues'));
    await disconnectDB().catch((err) => logger.error({ err }, 'Error disconnecting Mongo'));
    redis.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Fatal boot error');
  process.exit(1);
});
