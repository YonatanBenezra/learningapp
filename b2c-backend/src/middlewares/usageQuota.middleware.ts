import type { Request, Response, NextFunction } from 'express';
import {
  consumeQuota,
  QuotaError,
  type QuotaKind,
} from '../modules/subscriptions/usageQuota.service';

// Enforces per-day AI usage quotas BEFORE the endpoint runs (§9). Must run after
// authenticate (needs req.user) and before any AI-calling controller.
export const usageQuota =
  (kind: QuotaKind) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const { limit, used } = await consumeQuota(user.id, user.tier, kind);
      res.setHeader('X-Quota-Limit', String(limit));
      res.setHeader('X-Quota-Remaining', String(Math.max(0, limit - used)));
      next();
    } catch (err) {
      if (err instanceof QuotaError) {
        res.setHeader('X-Quota-Limit', String(err.limit));
        res.setHeader('X-Quota-Remaining', '0');
        res.status(429).json({ error: err.message, kind: err.kind, limit: err.limit });
        return;
      }
      next(err);
    }
  };
