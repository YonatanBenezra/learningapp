import { URL } from 'node:url';

export type ParsedRedisConnection = {
  host: string;
  port: number;
  username?: string;
  password?: string;
  tls?: Record<string, never>;
};

export function parseRedisUrl(redisUrl: string): ParsedRedisConnection {
  const parsed = new URL(redisUrl);
  const tls = parsed.protocol === 'rediss:' ? {} : undefined;

  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
    username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    tls,
  };
}
