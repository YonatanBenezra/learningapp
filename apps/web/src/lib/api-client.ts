import { env } from "./env";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${env.apiUrl}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        return response.ok;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export async function apiClient<T>(
  path: string,
  init?: RequestInit,
  retried = false,
): Promise<T> {
  const response = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (response.status === 401 && !retried && !path.startsWith("/auth/")) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      return apiClient<T>(path, init, true);
    }
  }

  if (!response.ok) {
    const body = await readBody(response);
    throw new ApiError(
      messageFromBody(response.status, body),
      response.status,
      body,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function messageFromBody(status: number, body: unknown): string {
  if (typeof body === "string" && body.trim()) {
    return body;
  }
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.message === "string") {
      return record.message;
    }
    if (Array.isArray(record.message)) {
      return record.message.map(String).join("; ");
    }
    if (record.message && typeof record.message === "object") {
      return messageFromBody(status, record.message);
    }
  }
  return `Request failed (${status})`;
}
