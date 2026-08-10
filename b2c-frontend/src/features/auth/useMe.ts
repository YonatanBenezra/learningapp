'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { refreshSession } from '@/src/infrastructure/apiClient';
import { useAuthStore } from '@/src/store/authStore';
import { defaultDashboardPath } from '@/src/features/auth/dashboardRoutes';
import * as authApi from './authApi';

/** Restore session from httpOnly cookies on app load. */
export function AuthSessionBootstrap() {
  const started = useRef(false);
  const setUser = useAuthStore((s) => s.setUser);
  const setSessionReady = useAuthStore((s) => s.setSessionReady);
  const setBootstrapPhase = useAuthStore((s) => s.setBootstrapPhase);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      setBootstrapPhase('checking-session');
      try {
        const session = await authApi.getSession();
        setUser(session.user);
        if (session.user) setBootstrapPhase('loading-profile');
      } catch {
        setBootstrapPhase('refreshing-session');
        try {
          const refreshed = await refreshSession();
          if (refreshed) {
            const session = await authApi.getSession();
            setUser(session.user);
            if (session.user) setBootstrapPhase('loading-profile');
          } else {
            clear();
          }
        } catch {
          clear();
        }
      } finally {
        setSessionReady(true);
        if (!useAuthStore.getState().user) {
          setBootstrapPhase('ready');
        }
      }
    })();
  }, [setUser, setSessionReady, setBootstrapPhase, clear]);

  return null;
}

/** Keeps auth user (tier, role, etc.) in sync with the database. */
export function useMe() {
  const router = useRouter();
  const pathname = usePathname();
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const setUser = useAuthStore((s) => s.setUser);
  const setBootstrapPhase = useAuthStore((s) => s.setBootstrapPhase);

  const query = useQuery({
    queryKey: ['me'],
    queryFn: authApi.getMe,
    enabled: sessionReady && isAuthenticated,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!sessionReady || !isAuthenticated) return;
    if (query.isFetching) {
      setBootstrapPhase('loading-profile');
      return;
    }
    if (query.isSuccess || query.isError) {
      setBootstrapPhase('ready');
    }
  }, [sessionReady, isAuthenticated, query.isFetching, query.isSuccess, query.isError, setBootstrapPhase]);

  useEffect(() => {
    const user = query.data?.user;
    if (!user) return;

    setUser(user);

    const roleHome = defaultDashboardPath(user.role);
    if (user.role === 'admin' && (pathname === '/dashboard' || pathname === '/instructor/dashboard')) {
      router.replace(roleHome);
    } else if (user.role === 'instructor' && pathname === '/dashboard') {
      router.replace(roleHome);
    }
  }, [query.data?.user, setUser, pathname, router]);

  return query;
}

export function AuthSessionSync() {
  useMe();
  return null;
}

export default AuthSessionBootstrap;
