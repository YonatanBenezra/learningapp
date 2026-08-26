import type { CookieOptions, Response } from 'express';
import { ACCESS_COOKIE, REFRESH_COOKIE } from './auth.constants';

export function readCookie(
  req: { cookies?: Record<string, unknown> },
  name: string,
): string | undefined {
  const value = req.cookies?.[name];
  return typeof value === 'string' ? value : undefined;
}

export type AuthCookieOptions = {
  accessMaxAgeMs: number;
  refreshMaxAgeMs: number;
  secure: boolean;
  domain?: string;
};

function baseOptions(
  maxAge: number,
  options: Pick<AuthCookieOptions, 'secure' | 'domain'>,
): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: options.secure,
    path: '/',
    maxAge,
    ...(options.domain ? { domain: options.domain } : {}),
  };
}

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
  options: AuthCookieOptions,
): void {
  res.cookie(
    ACCESS_COOKIE,
    tokens.accessToken,
    baseOptions(options.accessMaxAgeMs, options),
  );
  res.cookie(
    REFRESH_COOKIE,
    tokens.refreshToken,
    baseOptions(options.refreshMaxAgeMs, options),
  );
}

export function clearAuthCookies(
  res: Response,
  options: Pick<AuthCookieOptions, 'secure' | 'domain'>,
): void {
  res.clearCookie(ACCESS_COOKIE, baseOptions(0, options));
  res.clearCookie(REFRESH_COOKIE, baseOptions(0, options));
}
