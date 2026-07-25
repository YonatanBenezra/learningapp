'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthHydrated } from '@/src/features/auth/useAuthHydrated';
import { useAuthStore } from '@/src/store/authStore';
import * as authApi from './authApi';

/** Keeps persisted auth user (tier, role, etc.) in sync with the database. */
export function useMe() {
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const setUser = useAuthStore((s) => s.setUser);

  const query = useQuery({
    queryKey: ['me'],
    queryFn: authApi.getMe,
    enabled: hydrated && isAuthenticated,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (query.data?.user) setUser(query.data.user);
  }, [query.data?.user, setUser]);

  return query;
}

export function AuthSessionSync() {
  useMe();
  return null;
}
