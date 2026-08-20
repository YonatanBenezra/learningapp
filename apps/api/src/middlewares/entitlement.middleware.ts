import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../common/errors/AppError';
import { assertPlatformAccess } from '../modules/subscriptions/subscription.service';

// Gates a premium-only endpoint (§6). Reads the tier from the access token, so a
// freshly-upgraded user must refresh their token for this to take effect (the
// course multi-course gate reads User.tier from the DB and applies immediately).
export function requirePremium(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.tier !== 'premium') {
    next(new AppError(403, 'This feature requires a Premium subscription.'));
    return;
  }
  next();
}

// Blocks AI/generation routes once the 3-month platform trial ends without a paid plan.
export async function requirePlatformAccess(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user?.id) {
      next(new AppError(401, 'Authentication required'));
      return;
    }
    await assertPlatformAccess(req.user.id);
    next();
  } catch (err) {
    next(err);
  }
}
