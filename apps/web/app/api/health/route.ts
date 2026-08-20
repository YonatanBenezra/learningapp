import { NextResponse } from 'next/server';

function backendBaseUrl(): string {
  return (process.env.BACKEND_URL ?? 'http://localhost:4000').trim().replace(/\/$/, '');
}

/** Quick check: is the frontend proxy configured and can it reach the backend? */
export async function GET() {
  const raw = process.env.BACKEND_URL?.trim() ?? '';
  const configured = Boolean(raw);
  const backend = backendBaseUrl();

  const base = {
    proxy: 'frontend /api proxy',
    backendUrlConfigured: configured,
    backendUrlLength: raw.length,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
  };

  try {
    const res = await fetch(`${backend}/health`, { cache: 'no-store' });
    const health = await res.json().catch(() => null);

    return NextResponse.json({
      ...base,
      ok: res.ok,
      backendHealthStatus: res.status,
      backendHealth: health,
      hint: configured
        ? 'BACKEND_URL is set. If API calls still fail, redeploy after changing env vars.'
        : 'BACKEND_URL is missing at runtime. On Vercel: save the env var, then Deployments → Redeploy (env changes do not apply to old deployments).',
    });
  } catch {
    return NextResponse.json(
      {
        ...base,
        ok: false,
        backendHealthStatus: null,
        hint: configured
          ? `Could not reach ${backend}. Check backend is running and URL is correct.`
          : 'Set BACKEND_URL on Vercel (Project → Settings → Environment Variables), then Redeploy — saving alone is not enough.',
      },
      { status: 502 },
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
