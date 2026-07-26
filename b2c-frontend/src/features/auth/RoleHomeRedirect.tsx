'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthHydrated } from '@/src/features/auth/useAuthHydrated';
import { defaultDashboardPath } from '@/src/features/auth/dashboardRoutes';
import { useAuthStore } from '@/src/store/authStore';

const learnerHomePaths = new Set(['/dashboard']);
const instructorHomePaths = new Set(['/instructor/dashboard']);

export function RoleHomeRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);
  const applied = useRef<string | null>(null);

  useEffect(() => {
    if (!hydrated || !user?.role) return;
    if (applied.current === pathname) return;

    const roleHome = defaultDashboardPath(user.role);

    if (user.role === 'admin') {
      if (learnerHomePaths.has(pathname) || instructorHomePaths.has(pathname)) {
        applied.current = roleHome;
        router.replace(roleHome);
      }
      return;
    }

    if (user.role === 'instructor' && learnerHomePaths.has(pathname)) {
      applied.current = roleHome;
      router.replace(roleHome);
    }
  }, [hydrated, user?.role, pathname, router]);

  return null;
}

export default RoleHomeRedirect;
