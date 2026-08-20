import { Redis, type RedisOptions } from 'ioredis';
import { env } from './env';

// BullMQ requires `maxRetriesPerRequest: null` on its connections.
const baseOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
};

export function redisConnectionOptions(): RedisOptions {
  const url = new URL(env.redisUrl);
  return {
    ...baseOptions,
    host: url.hostname,
    port: url.port ? Number(url.port) : 6379,
    username: url.username || undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    ...(url.protocol === 'rediss:' ? { tls: {} } : {}),
  };
}

export function createRedis(options: RedisOptions = {}): Redis {
  return new Redis({ ...redisConnectionOptions(), ...options });
}

// Shared app-level client. Lazy: no socket opens until the first command (or an
// explicit `.connect()` in the server bootstrap), keeping test imports side-effect free.
export const redis = createRedis({ lazyConnect: true });

export async function pingRedis(): Promise<boolean> {
  if (!env.redisEnabled) return true;
  try {
    return (await redis.ping()) === 'PONG';
  } catch {
    return false;
  }
}
