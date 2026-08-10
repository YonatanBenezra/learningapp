'use client';

import { AUTH_LOADING_MESSAGES } from './authLoadingMessages';
import { useAuthStore } from '@/src/store/authStore';

export function useAuthLoadingMessage(options?: { redirecting?: boolean }) {
  const phase = useAuthStore((state) => state.bootstrapPhase);

  if (options?.redirecting) {
    return AUTH_LOADING_MESSAGES.redirecting;
  }

  return AUTH_LOADING_MESSAGES[phase];
}
