'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthHydrated } from '@/src/features/auth/useAuthHydrated';
import { useAuthStore } from '@/src/store/authStore';
import * as notificationsApi from './notificationsApi';

export function useNotifications() {
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  return useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getMyNotifications,
    enabled: hydrated && isAuthenticated,
    staleTime: 60_000,
  });
}
