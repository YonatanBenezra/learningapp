'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/src/store/authStore';
import * as authApi from './authApi';
import { defaultDashboardPath } from './dashboardRoutes';

export { useMe, AuthSessionSync } from './useMe';

function navigateAfterAuth(router: ReturnType<typeof useRouter>, defaultPath: string) {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect');
  router.push(redirect?.startsWith('/') ? redirect : defaultPath);
}

function invalidateAssessmentQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['skill-assessments-mine'] });
}

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const setSessionReady = useAuthStore((s) => s.setSessionReady);
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setUser(data.user);
      setSessionReady(true);
      invalidateAssessmentQueries(queryClient);
      navigateAfterAuth(router, defaultDashboardPath(data.user.role));
    },
  });
}

export function useSignup() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const setSessionReady = useAuthStore((s) => s.setSessionReady);
  return useMutation({
    mutationFn: authApi.signup,
    onSuccess: (data) => {
      setUser(data.user);
      setSessionReady(true);
      invalidateAssessmentQueries(queryClient);
      navigateAfterAuth(router, '/create-course');
    },
  });
}

export function useGoogleLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const setSessionReady = useAuthStore((s) => s.setSessionReady);
  return useMutation({
    mutationFn: authApi.loginWithGoogle,
    onSuccess: (data) => {
      setUser(data.user);
      setSessionReady(true);
      invalidateAssessmentQueries(queryClient);
      navigateAfterAuth(router, defaultDashboardPath(data.user.role));
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);
  return () => {
    void authApi.logout().catch(() => {});
    clear();
    router.push('/login');
  };
}
