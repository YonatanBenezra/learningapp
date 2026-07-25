'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/src/store/authStore';
import { Spinner } from '@/src/components/ui/spinner';
import { useAuthHydrated } from './useAuthHydrated';

function FullScreen() {
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center">
      <Spinner className="size-6 text-primary" />
    </div>
  );
}

// Protects authenticated routes. Waits for store hydration before deciding, so a
// logged-in user isn't bounced to /login on first paint.
export function RequireAuth({
  children,
  redirectTo = '/login',
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (hydrated && !token) router.replace(redirectTo);
  }, [hydrated, token, router, redirectTo]);

  if (!hydrated) return <FullScreen />;
  if (!token) return null; // redirecting
  return <>{children}</>;
}

// Admin-only routes. Non-admins are sent back to the learner dashboard.
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (hydrated && token && user && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [hydrated, token, user, router]);

  if (!hydrated) return <FullScreen />;
  if (!token || !user) return null;
  if (user.role !== 'admin') return null;
  return <>{children}</>;
}

function isInstructorRole(role?: string | null) {
  return role === 'instructor' || role === 'admin';
}

// Instructor dashboard routes. Learners are sent back to the main dashboard.
export function RequireInstructor({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (hydrated && token && user && !isInstructorRole(user.role)) {
      router.replace('/dashboard');
    }
  }, [hydrated, token, user, router]);

  if (!hydrated) return <FullScreen />;
  if (!token || !user) return null;
  if (!isInstructorRole(user.role)) return null;
  return <>{children}</>;
}

// For /login and /signup: send users who ARRIVE already-authenticated to the
// dashboard. The check runs once (in an effect, after hydration) so it does NOT
// fire mid-flow — otherwise the token appearing during signup would hijack the
// intended /create-course redirect and dump the user on /dashboard.
export function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const decided = useRef(false);

  useEffect(() => {
    if (!hydrated || decided.current) return;
    decided.current = true;
    if (useAuthStore.getState().accessToken) {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      router.replace(redirect?.startsWith('/') ? redirect : '/dashboard');
    }
  }, [hydrated, router]);

  return <>{children}</>;
}
