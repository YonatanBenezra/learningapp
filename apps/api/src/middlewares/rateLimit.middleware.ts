import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { redis } from '../config/redis';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix: string;
}

function setHeaders(res: Response, max: number, count: number): void {
  res.setHeader('X-RateLimit-Limit', String(max));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - count)));
}

// Fixed-window limiter keyed by client IP — used for auth endpoints (pre-login).
export const rateLimit =
  ({ windowMs, max, keyPrefix }: RateLimitOptions) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!env.redisEnabled) {
      next();
      return;
    }
    try {
      const key = `rl:${keyPrefix}:${req.ip ?? 'unknown'}`;
      const count = await redis.incr(key);
      if (count === 1) await redis.pexpire(key, windowMs);
      setHeaders(res, max, count);
      if (count > max) {
        res.status(429).json({ error: 'Too many requests, please try again later.' });
        return;
      }
      next();
    } catch (err) {
      next(err);
    }
  };

interface UserRateLimitOptions {
  windowMs: number;
  free: number;
  premium: number;
  keyPrefix: string;
}

// Tier-aware limiter keyed by user — for AI-generation endpoints (§7.1). Falls
// back to IP when unauthenticated. Runs after authenticate.
export const userRateLimit =
  ({ windowMs, free, premium, keyPrefix }: UserRateLimitOptions) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!env.redisEnabled) {
      next();
      return;
    }
    try {
      const id = req.user?.id ?? req.ip ?? 'unknown';
      const max = req.user?.tier === 'premium' ? premium : free;
      const key = `rl:${keyPrefix}:${id}`;
      const count = await redis.incr(key);
      if (count === 1) await redis.pexpire(key, windowMs);
      setHeaders(res, max, count);
      if (count > max) {
        res.status(429).json({ error: 'Rate limit exceeded, please slow down.' });
        return;
      }
      next();
    } catch (err) {
      next(err);
    }
  };

// Shared limiter for AI-generation endpoints (burst protection; per-day cost caps
// are enforced separately by usageQuota).
export const aiRateLimit = userRateLimit({
  windowMs: 60_000,
  free: 30,
  premium: 120,
  keyPrefix: 'ai',
});
