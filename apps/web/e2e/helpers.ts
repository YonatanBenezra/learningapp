import type { Page } from '@playwright/test';

const apiBase = process.env.E2E_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const ACCESS_COOKIE = 'bina_access';
const REFRESH_COOKIE = 'bina_refresh';

export interface AuthSession {
  user: { id: string; email?: string; role?: string; tier?: string; preferences?: unknown };
  accessToken: string;
  refreshToken: string;
}

function parseSetCookie(headers: Headers): { accessToken: string; refreshToken: string } {
  const cookies: Record<string, string> = {};
  for (const header of headers.getSetCookie?.() ?? []) {
    const [pair] = header.split(';');
    const i = pair.indexOf('=');
    if (i > 0) cookies[pair.slice(0, i).trim()] = pair.slice(i + 1);
  }
  const accessToken = cookies[ACCESS_COOKIE];
  const refreshToken = cookies[REFRESH_COOKIE];
  if (!accessToken || !refreshToken) {
    throw new Error('Auth response missing httpOnly cookies');
  }
  return { accessToken, refreshToken };
}

export async function isBackendHealthy(): Promise<boolean> {
  try {
    const res = await fetch(`${apiBase}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(3000),
      });
      return res.status === 400 || res.status === 401 || res.status === 422;
    } catch {
      return false;
    }
  }
}

export async function signupViaApi(email: string, password: string): Promise<AuthSession> {
  const res = await fetch(`${apiBase}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Signup failed (${res.status}): ${body}`);
  }
  const body = (await res.json()) as { user: AuthSession['user'] };
  const tokens = parseSetCookie(res.headers);
  return { user: body.user, ...tokens };
}

export async function loginViaApi(email: string, password: string): Promise<AuthSession> {
  const res = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Login failed (${res.status}): ${body}`);
  }
  const body = (await res.json()) as { user: AuthSession['user'] };
  const tokens = parseSetCookie(res.headers);
  return { user: body.user, ...tokens };
}

/** Seed browser cookies so the Next.js /api proxy sends auth on each request. */
export async function seedAuthSession(page: Page, auth: AuthSession) {
  const hostname = new URL(page.url() || 'http://localhost:3000').hostname;

  await page.context().addCookies([
    {
      name: ACCESS_COOKIE,
      value: auth.accessToken,
      domain: hostname,
      path: '/api',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
    {
      name: REFRESH_COOKIE,
      value: auth.refreshToken,
      domain: hostname,
      path: '/api/auth',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

export function uniqueEmail(prefix = 'e2e') {
  return `${prefix}-${Date.now()}@bina-test.local`;
}
