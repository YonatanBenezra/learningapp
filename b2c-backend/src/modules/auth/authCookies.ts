import type { CookieOptions, Request, Response } from 'express';
import { env } from '../../config/env';

export const ACCESS_COOKIE = 'bina_access';
export const REFRESH_COOKIE = 'bina_refresh';

function baseCookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: env.authCookieSecure,
    sameSite: env.authCookieSameSite,
    maxAge: maxAgeMs,
  };
}

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
): void {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...baseCookieOptions(15 * 60 * 1000),
    path: env.authCookiePath,
  });

  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseCookieOptions(30 * 24 * 60 * 60 * 1000),
    path: `${env.authCookiePath}/auth`,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, {
    path: env.authCookiePath,
    httpOnly: true,
    secure: env.authCookieSecure,
    sameSite: env.authCookieSameSite,
  });
  res.clearCookie(REFRESH_COOKIE, {
    path: `${env.authCookiePath}/auth`,
    httpOnly: true,
    secure: env.authCookieSecure,
    sameSite: env.authCookieSameSite,
  });
}

export function readAccessToken(req: Request): string | undefined {
  const value = req.cookies?.[ACCESS_COOKIE];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function readRefreshToken(req: Request): string | undefined {
  const value = req.cookies?.[REFRESH_COOKIE];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function extractAccessToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return readAccessToken(req) ?? null;
}

export function extractRefreshToken(req: Request, bodyToken?: string): string | null {
  return readRefreshToken(req) ?? bodyToken ?? null;
}
