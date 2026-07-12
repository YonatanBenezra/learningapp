import type { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix: string;
}

// Basic fixed-window limiter backed by Redis, keyed by client IP.
// Tier-aware limiting for AI-cost endpoints comes in Phase 7 (§9).
export const rateLimit =
  ({ windowMs, max, keyPrefix }: RateLimitOptions) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const identifier = req.ip ?? 'unknown';
      const key = `rl:${keyPrefix}:${identifier}`;
      const count = await redis.incr(key);
      if (count === 1) await redis.pexpire(key, windowMs);
      if (count > max) {
        res.status(429).json({ error: 'Too many requests, please try again later.' });
        return;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
