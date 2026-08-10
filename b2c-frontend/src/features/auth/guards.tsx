'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AuthWorkspaceLoader } from './AuthWorkspaceLoader';
import { useAuthHydrated } from './useAuthHydrated';
import { useAuthStore } from '@/src/store/authStore';
import { defaultDashboardPath, isLearnerDashboardPath } from './dashboardRoutes';

export function RequireAuth({
  children,
  redirectTo = '/login',
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const bootstrapPhase = useAuthStore((s) => s.bootstrapPhase);

  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace(redirectTo);
  }, [hydrated, isAuthenticated, router, redirectTo]);

  if (!hydrated || (isAuthenticated && bootstrapPhase === 'loading-profile')) {
    return <AuthWorkspaceLoader />;
  }
  if (!isAuthenticated) return <AuthWorkspaceLoader redirecting />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);
  const bootstrapPhase = useAuthStore((s) => s.bootstrapPhase);

  useEffect(() => {
    if (hydrated && user && user.role !== 'admin') {
      router.replace(defaultDashboardPath(user.role));
    }
  }, [hydrated, user, router]);

  if (!hydrated || (user && bootstrapPhase === 'loading-profile')) return <AuthWorkspaceLoader />;
  if (!user) return <AuthWorkspaceLoader redirecting />;
  if (user.role !== 'admin') return <AuthWorkspaceLoader redirecting />;
  return <>{children}</>;
}

function isInstructorRole(role?: string | null) {
  return role === 'instructor' || role === 'admin';
}

export function RequireInstructor({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);
  const bootstrapPhase = useAuthStore((s) => s.bootstrapPhase);

  useEffect(() => {
    if (hydrated && user && !isInstructorRole(user.role)) {
      router.replace(defaultDashboardPath(user.role));
    }
  }, [hydrated, user, router]);

  if (!hydrated || (user && bootstrapPhase === 'loading-profile')) return <AuthWorkspaceLoader />;
  if (!user) return <AuthWorkspaceLoader redirecting />;
  if (!isInstructorRole(user.role)) return <AuthWorkspaceLoader redirecting />;
  return <>{children}</>;
}

export function RequireLearnerDashboard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);
  const learnerHome = isLearnerDashboardPath(user?.role);
  const bootstrapPhase = useAuthStore((s) => s.bootstrapPhase);

  useEffect(() => {
    if (!hydrated || !user || learnerHome) return;
    router.replace(defaultDashboardPath(user.role));
  }, [hydrated, user, learnerHome, router]);

  if (!hydrated || (user && bootstrapPhase === 'loading-profile')) return <AuthWorkspaceLoader />;
  if (!user) return <AuthWorkspaceLoader redirecting />;
  if (!learnerHome) return <AuthWorkspaceLoader redirecting />;
  return <>{children}</>;
}

export function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const decided = useRef(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!hydrated || decided.current) return;
    decided.current = true;
    if (isAuthenticated && user) {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      router.replace(redirect?.startsWith('/') ? redirect : defaultDashboardPath(user.role));
    }
  }, [hydrated, isAuthenticated, user, router]);

  return <>{children}</>;
}
