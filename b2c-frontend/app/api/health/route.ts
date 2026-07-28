import { NextResponse } from 'next/server';

function backendBaseUrl(): string {
  return (process.env.BACKEND_URL ?? 'http://localhost:4000').trim().replace(/\/$/, '');
}

/** Quick check: is the frontend proxy configured and can it reach the backend? */
export async function GET() {
  const configured = Boolean(process.env.BACKEND_URL?.trim());
  const backend = backendBaseUrl();

  try {
    const res = await fetch(`${backend}/health`, { cache: 'no-store' });
    const health = await res.json().catch(() => null);

    return NextResponse.json({
      ok: res.ok,
      proxy: 'frontend /api proxy',
      backendUrlConfigured: configured,
      backendHealthStatus: res.status,
      backendHealth: health,
      hint: configured
        ? 'BACKEND_URL is set. If API calls still fail, redeploy after changing env vars.'
        : 'BACKEND_URL is missing on the FRONTEND service — proxy defaults to localhost:4000.',
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        proxy: 'frontend /api proxy',
        backendUrlConfigured: configured,
        backendHealthStatus: null,
        hint: configured
          ? `Could not reach ${backend}. Check backend is running and URL is correct.`
          : 'Set BACKEND_URL on the FRONTEND Render service (not the backend service).',
      },
      { status: 502 },
    );
  }
}

export const dynamic = 'force-dynamic';
