import type { AuthUser } from './index';

// Attach the authenticated identity to Express requests (set by auth.middleware).
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
