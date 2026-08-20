'use client';

import { RequireAuth } from '@/src/features/auth';
import { AuthenticatedAppShell } from '@/src/components/layout/AuthenticatedAppShell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AuthenticatedAppShell>{children}</AuthenticatedAppShell>
    </RequireAuth>
  );
}
