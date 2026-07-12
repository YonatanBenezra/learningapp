import type { Request, Response, NextFunction } from 'express';

// Gates premium-only features (§6).
export const entitlement =
  (_feature: string) => (_req: Request, _res: Response, next: NextFunction) => {
    // TODO: check user tier/entitlements
    next();
  };
