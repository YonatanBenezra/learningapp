'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/src/store/authStore';
import * as authApi from './authApi';

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
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data);
      invalidateAssessmentQueries(queryClient);
      navigateAfterAuth(router, '/dashboard');
    },
  });
}

export function useSignup() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: authApi.signup,
    onSuccess: (data) => {
      setAuth(data);
      invalidateAssessmentQueries(queryClient);
      navigateAfterAuth(router, '/create-course');
    },
  });
}

export function useGoogleLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: authApi.loginWithGoogle,
    onSuccess: (data) => {
      setAuth(data);
      invalidateAssessmentQueries(queryClient);
      navigateAfterAuth(router, '/dashboard');
    },
  });
}

export function useLogout() {
  const router = useRouter();
  return () => {
    const { refreshToken, clear } = useAuthStore.getState();
    // Revoke the refresh-token family server-side (fire-and-forget), then clear locally.
    if (refreshToken) void authApi.logout(refreshToken).catch(() => {});
    clear();
    router.push('/login');
  };
}
