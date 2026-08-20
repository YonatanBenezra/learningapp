import { config } from '@/src/config/env';
import type { User } from '@/src/domain/user';
import { useAuthStore } from '@/src/store/authStore';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let refreshing: Promise<boolean> | null = null;

export async function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = fetch(`${config.apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
      .then(async (res) => {
        if (!res.ok) {
          useAuthStore.getState().clear();
          return false;
        }
        const data = (await res.json()) as { user?: User };
        if (data.user) useAuthStore.getState().setUser(data.user);
        return true;
      })
      .catch(() => {
        useAuthStore.getState().clear();
        return false;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

export async function apiClient<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const res = await fetch(`${config.apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 401 && retry) {
    const ok = await refreshSession();
    if (ok) return apiClient<T>(path, init, false);
  }

  if (!res.ok) {
    let body: { error?: string; details?: unknown } = {};
    try {
      body = await res.json();
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, body.error ?? res.statusText, body.details);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
