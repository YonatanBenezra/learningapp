import { NextRequest, NextResponse } from 'next/server';

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
]);

function backendBaseUrl(): string {
  return (process.env.BACKEND_URL ?? 'http://localhost:4000').trim().replace(/\/$/, '');
}

/** Strip Domain= from upstream cookies so they bind to the frontend host. */
function normalizeSetCookie(header: string): string {
  return header
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !/^domain=/i.test(part))
    .join('; ');
}

async function proxy(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const backend = backendBaseUrl();
  const target = `${backend}/${path.join('/')}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === 'host' || HOP_BY_HOP.has(lower)) return;
    headers.set(key, value);
  });

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual',
    cache: 'no-store',
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch {
    return NextResponse.json(
      {
        error: 'Backend unreachable from frontend proxy',
        backendUrlConfigured: Boolean(process.env.BACKEND_URL?.trim()),
        hint:
          'On the FRONTEND host: BACKEND_URL=https://learningapp-iw8r.onrender.com and NEXT_PUBLIC_API_URL=/api. Redeploy after env changes.',
      },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();

  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === 'set-cookie' || HOP_BY_HOP.has(lower)) return;
    responseHeaders.set(key, value);
  });

  const setCookies =
    typeof upstream.headers.getSetCookie === 'function'
      ? upstream.headers.getSetCookie()
      : upstream.headers.get('set-cookie')
        ? [upstream.headers.get('set-cookie')!]
        : [];

  for (const cookie of setCookies) {
    responseHeaders.append('Set-Cookie', normalizeSetCookie(cookie));
  }

  if (upstream.status === 204 || upstream.status === 205) {
    return new NextResponse(null, {
      status: upstream.status,
      headers: responseHeaders,
    });
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const dynamic = 'force-dynamic';

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
