import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../common/utils/logger';

mongoose.set('strictQuery', true);

export async function connectDB(): Promise<void> {
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB connection error'));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  // Fail fast on boot if the server can't be reached.
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
  logger.info('MongoDB connected');
}

// Build every declared index before the server accepts traffic. Correctness of
// race-safe counters like the usage quota (unique userId+period+periodStart)
// depends on the unique index existing — autoIndex builds it lazily in the
// background, leaving a cold-start window where concurrent upserts could create
// duplicate docs and bypass the quota. Awaiting init() closes that window.
export async function ensureIndexes(): Promise<void> {
  await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).init()));
  logger.info('MongoDB indexes ensured');
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
