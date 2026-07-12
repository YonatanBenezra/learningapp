import { Redis, type RedisOptions } from 'ioredis';
import { env } from './env';

// BullMQ requires `maxRetriesPerRequest: null` on its connections.
const baseOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
};

export function createRedis(options: RedisOptions = {}): Redis {
  return new Redis(env.redisUrl, { ...baseOptions, ...options });
}

// Shared app-level client. Lazy: no socket opens until the first command (or an
// explicit `.connect()` in the server bootstrap), keeping test imports side-effect free.
export const redis = createRedis({ lazyConnect: true });
