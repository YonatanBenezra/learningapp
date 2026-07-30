'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppLoader } from '@/src/components/ui/app-loader';
import { useAuthHydrated } from './useAuthHydrated';
import { useAuthStore } from '@/src/store/authStore';
import { defaultDashboardPath, isLearnerDashboardPath } from './dashboardRoutes';

function FullScreen() {
  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center bg-bg px-4">
      <AppLoader size="lg" label="Loading your workspace" description="Checking your session…" />
    </div>
  );
}

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

  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace(redirectTo);
  }, [hydrated, isAuthenticated, router, redirectTo]);

  if (!hydrated) return <FullScreen />;
  if (!isAuthenticated) return null;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (hydrated && user && user.role !== 'admin') {
      router.replace(defaultDashboardPath(user.role));
    }
  }, [hydrated, user, router]);

  if (!hydrated) return <FullScreen />;
  if (!user) return null;
  if (user.role !== 'admin') return null;
  return <>{children}</>;
}

function isInstructorRole(role?: string | null) {
  return role === 'instructor' || role === 'admin';
}

export function RequireInstructor({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (hydrated && user && !isInstructorRole(user.role)) {
      router.replace(defaultDashboardPath(user.role));
    }
  }, [hydrated, user, router]);

  if (!hydrated) return <FullScreen />;
  if (!user) return null;
  if (!isInstructorRole(user.role)) return null;
  return <>{children}</>;
}

export function RequireLearnerDashboard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);
  const learnerHome = isLearnerDashboardPath(user?.role);

  useEffect(() => {
    if (!hydrated || !user || learnerHome) return;
    router.replace(defaultDashboardPath(user.role));
  }, [hydrated, user, learnerHome, router]);

  if (!hydrated) return <FullScreen />;
  if (!user) return null;
  if (!learnerHome) return null;
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
