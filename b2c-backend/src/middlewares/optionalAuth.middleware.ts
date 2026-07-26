import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../modules/auth/token.service';
import { extractAccessToken } from '../modules/auth/authCookies';

// Attaches req.user when a valid access token is present; otherwise continues as guest.
export function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
  const token = extractAccessToken(req);
  if (!token) {
    next();
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, tier: payload.tier };
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
