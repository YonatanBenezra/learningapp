import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../modules/auth/token.service';
import { AppError } from '../common/errors/AppError';
import type { Role } from '../common/types';

// Verifies the Bearer access token and attaches `req.user`.
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'Missing or invalid Authorization header');
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = { id: payload.sub, role: payload.role, tier: payload.tier };
  } catch {
    throw new AppError(401, 'Invalid or expired access token');
  }
  next();
}

// Guards a route to specific roles. Must run after `authenticate`.
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, 'Forbidden');
    }
    next();
  };
}
