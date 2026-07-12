import { createServer } from 'node:http';
import { app } from './app';
import { env } from './config/env';
import { connectDB, disconnectDB } from './config/db';
import { redis } from './config/redis';
import { closeQueues } from './jobs/queue';
import {
  startCourseGenerationWorker,
  stopCourseGenerationWorker,
} from './jobs/courseGenerationWorker';
import { logger } from './common/utils/logger';

async function bootstrap(): Promise<void> {
  await connectDB();
  await redis.connect();
  logger.info('Redis connected');

  startCourseGenerationWorker();

  const server = createServer(app);
  server.listen(env.port, () => logger.info(`b2c-backend listening on :${env.port}`));

  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} received — shutting down`);
    server.close();
    await stopCourseGenerationWorker().catch((err) =>
      logger.error({ err }, 'Error stopping worker'),
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
