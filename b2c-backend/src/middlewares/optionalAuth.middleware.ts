import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../modules/auth/token.service';

// Attaches req.user when a valid Bearer token is present; otherwise continues as guest.
// If a Bearer token is present but invalid/expired, respond 401 so the client can refresh
// instead of silently listing guest data for a signed-in user.
export function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = { id: payload.sub, role: payload.role, tier: payload.tier };
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
