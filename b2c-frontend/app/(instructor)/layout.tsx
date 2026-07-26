'use client';

import { RequireAuth, RequireInstructor } from '@/src/features/auth';
import { AuthenticatedAppShell } from '@/src/components/layout/AuthenticatedAppShell';

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <RequireInstructor>
        <AuthenticatedAppShell>{children}</AuthenticatedAppShell>
      </RequireInstructor>
    </RequireAuth>
  );
}
