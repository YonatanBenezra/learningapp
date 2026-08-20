import type { Role } from '@/src/domain/user';

/** Default home dashboard for each role after login or when opening "Dashboard". */
export function defaultDashboardPath(role?: Role | string | null): string {
  if (role === 'admin') return '/admin/metrics';
  if (role === 'instructor') return '/instructor/dashboard';
  return '/dashboard';
}

export function isLearnerDashboardPath(role?: Role | string | null): boolean {
  return defaultDashboardPath(role) === '/dashboard';
}
