'use client';

import { RequireAuth, RequireAdmin } from '@/src/features/auth';
import { AuthenticatedAppShell } from '@/src/components/layout/AuthenticatedAppShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <RequireAdmin>
        <AuthenticatedAppShell>{children}</AuthenticatedAppShell>
      </RequireAdmin>
    </RequireAuth>
  );
}
