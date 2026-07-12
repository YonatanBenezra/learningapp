import type { Request, Response, NextFunction } from 'express';

// Enforces AI usage quotas BEFORE entitlement (§9). Runs ahead of any AI-calling endpoint.
export const usageQuota =
  (_kind: 'course' | 'exercise' | 'quiz' | 'exam' | 'lab') =>
  (_req: Request, _res: Response, next: NextFunction) => {
    // TODO: check + increment UsageQuota; 429 when exceeded
    next();
  };
