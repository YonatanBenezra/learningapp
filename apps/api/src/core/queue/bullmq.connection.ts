import type { RedisOptions as BullRedisOptions } from 'bullmq';
import { parseRedisUrl } from '../redis/redis-url';

export function bullmqConnection(redisUrl: string): BullRedisOptions {
  const parsed = parseRedisUrl(redisUrl);
  return {
    host: parsed.host,
    port: parsed.port,
    username: parsed.username,
    password: parsed.password,
    tls: parsed.tls,
    maxRetriesPerRequest: null,
  };
}
