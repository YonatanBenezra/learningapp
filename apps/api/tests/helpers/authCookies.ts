import type { Response } from 'supertest';

export const ACCESS_COOKIE = 'bina_access';
export const REFRESH_COOKIE = 'bina_refresh';

export interface AuthCookies {
  access: string;
  refresh: string;
}

export function parseAuthCookies(res: Response): AuthCookies {
  const raw = res.headers['set-cookie'];
  const list = raw ? (Array.isArray(raw) ? raw : [raw]) : [];
  const map: Record<string, string> = {};
  for (const header of list) {
    const [pair] = header.split(';');
    const i = pair.indexOf('=');
    if (i > 0) map[pair.slice(0, i).trim()] = pair.slice(i + 1);
  }
  const access = map[ACCESS_COOKIE];
  const refresh = map[REFRESH_COOKIE];
  if (!access || !refresh) {
    throw new Error(`Missing auth cookies: ${JSON.stringify(list)}`);
  }
  return { access, refresh };
}

export function cookieHeader(cookies: AuthCookies): string {
  return `${ACCESS_COOKIE}=${cookies.access}; ${REFRESH_COOKIE}=${cookies.refresh}`;
}
