'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/src/store/authStore';
import { markGuestSynced, readGuestBundle } from './guestStorage';
import { syncPractice } from './practiceApi';

/** Sync local guest progress to DB once after login. */
export function PracticeSyncBootstrap() {
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const syncing = useRef(false);

  useEffect(() => {
    if (!sessionReady || !isAuthenticated || syncing.current) return;
    const bundle = readGuestBundle();
    if (!bundle || bundle.synced || bundle.submissions.length === 0) return;

    syncing.current = true;
    void syncPractice(bundle)
      .then(() => markGuestSynced())
      .catch(() => {
        syncing.current = false;
      });
  }, [sessionReady, isAuthenticated]);

  return null;
}

export async function syncGuestIfNeeded(): Promise<void> {
  const bundle = readGuestBundle();
  if (!bundle || bundle.synced || bundle.submissions.length === 0) return;
  await syncPractice(bundle);
  markGuestSynced();
}
