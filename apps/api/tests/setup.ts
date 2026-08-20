import { afterEach } from 'vitest';
import { redis } from '../src/config/redis';

// The IP-based auth limiter counts every signup/login against a single key
// (rl:auth:<loopback>) in the shared test Redis. Across the whole suite that far
// exceeds the limit, so clear rate-limit keys after each test. Safe because files
// run serially (see vitest.config.ts) — nothing else runs mid-test to stomp a
// limiter counter under test. Guarded on connection status so pure-unit files
// (no Redis) don't open a stray handle.
afterEach(async () => {
  if (redis.status === 'ready') {
    const keys = await redis.keys('rl:*');
    if (keys.length) await redis.del(...keys);
  }
});
