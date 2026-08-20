'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/src/store/authStore';
import { MVP_PRACTICE_MODE, PRACTICE_PATH } from '@/src/config/mvp';
import * as authApi from './authApi';
import { defaultDashboardPath } from './dashboardRoutes';
import { syncGuestIfNeeded } from '@/src/features/practice';
import {
  assessmentStartRedirect,
  hasCompletedAssessment,
  isAssessmentCompleteLocal,
  markAssessmentComplete,
} from '@/src/features/skill-assessment/assessmentGate';
import { listMySkillAssessments } from '@/src/features/skill-assessment/skillAssessmentApi';

export { useMe, AuthSessionSync } from './useMe';

function isProblemsPath(path: string): boolean {
  return path === '/problems' || path.startsWith('/problems/') || path === '/practice';
}

async function resolvePostAuthPath(defaultPath: string): Promise<string> {
  if (!MVP_PRACTICE_MODE || !isProblemsPath(defaultPath)) return defaultPath;
  if (isAssessmentCompleteLocal()) return defaultPath;

  try {
    const { assessments } = await listMySkillAssessments();
    if (hasCompletedAssessment(assessments)) {
      markAssessmentComplete();
      return defaultPath;
    }
  } catch {
    /* fall through to assessment start */
  }

  return assessmentStartRedirect(defaultPath);
}

async function navigateAfterAuthResolved(
  router: ReturnType<typeof useRouter>,
  defaultPath: string,
) {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect');
  const target = redirect?.startsWith('/') ? redirect : defaultPath;
  const path = await resolvePostAuthPath(target);
  router.push(path);
}

function invalidateAssessmentQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['skill-assessments-mine'] });
}

async function afterAuthSuccess(
  queryClient: ReturnType<typeof useQueryClient>,
  router: ReturnType<typeof useRouter>,
  defaultPath: string,
) {
  invalidateAssessmentQueries(queryClient);
  if (MVP_PRACTICE_MODE) {
    try {
      await syncGuestIfNeeded();
    } catch {
      /* sync retried on next load via PracticeSyncBootstrap */
    }
  }
  navigateAfterAuthResolved(router, defaultPath);
}

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const setSessionReady = useAuthStore((s) => s.setSessionReady);
  const setBootstrapPhase = useAuthStore((s) => s.setBootstrapPhase);
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setUser(data.user);
      setSessionReady(true);
      setBootstrapPhase('loading-profile');
      void afterAuthSuccess(
        queryClient,
        router,
        MVP_PRACTICE_MODE ? PRACTICE_PATH : defaultDashboardPath(data.user.role),
      );
    },
  });
}

export function useSignup() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const setSessionReady = useAuthStore((s) => s.setSessionReady);
  const setBootstrapPhase = useAuthStore((s) => s.setBootstrapPhase);
  return useMutation({
    mutationFn: authApi.signup,
    onSuccess: (data) => {
      setUser(data.user);
      setSessionReady(true);
      setBootstrapPhase('loading-profile');
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (redirect?.startsWith('/')) {
        void afterAuthSuccess(queryClient, router, redirect);
        return;
      }
      if (MVP_PRACTICE_MODE) {
        void afterAuthSuccess(queryClient, router, PRACTICE_PATH);
        return;
      }
      if (data.user.role === 'user') {
        router.push('/assessment/start');
        return;
      }
      void afterAuthSuccess(queryClient, router, defaultDashboardPath(data.user.role));
    },
  });
}

export function useGoogleLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const setSessionReady = useAuthStore((s) => s.setSessionReady);
  const setBootstrapPhase = useAuthStore((s) => s.setBootstrapPhase);
  return useMutation({
    mutationFn: authApi.loginWithGoogle,
    onSuccess: (data) => {
      setUser(data.user);
      setSessionReady(true);
      setBootstrapPhase('loading-profile');
      void afterAuthSuccess(
        queryClient,
        router,
        MVP_PRACTICE_MODE ? PRACTICE_PATH : defaultDashboardPath(data.user.role),
      );
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
