import { config } from '@/src/config/env';
import { apiClient } from '@/src/infrastructure/apiClient';
import type { User } from '@/src/domain/user';

export interface UpdatePreferencesInput {
  visualsPreferred?: boolean;
  dailyNotification?: boolean;
  timezone?: string;
}

export function updatePreferences(input: UpdatePreferencesInput): Promise<{ user: User }> {
  return apiClient<{ user: User }>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function exportUserData(): Promise<void> {
  const res = await fetch(`${config.apiBaseUrl}/users/me/export`, {
    credentials: 'include',
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      message = body.error ?? message;
    } catch {
      /* non-JSON */
    }
    throw new Error(message);
  }
  const data = await res.json();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `bina-export-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function deleteAccount(): Promise<{ status: string; message: string }> {
  return apiClient<{ status: string; message: string }>('/users/me', {
    method: 'DELETE',
  });
}
