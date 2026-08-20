'use client';

import { useSyncExternalStore } from 'react';
import { useAuthStore } from '@/src/store/authStore';

// True once the client auth session has been resolved (cookie session check finished).
export function useAuthHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useAuthStore.subscribe((state, prev) => {
      if (state.sessionReady !== prev.sessionReady) cb();
    }),
    () => useAuthStore.getState().sessionReady,
    () => false,
  );
}
