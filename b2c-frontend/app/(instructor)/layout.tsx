'use client';

import { RequireAuth, RequireInstructor } from '@/src/features/auth';
import { InstructorShell } from '@/src/components/layout/InstructorShell';

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <RequireInstructor>
        <InstructorShell>{children}</InstructorShell>
      </RequireInstructor>
    </RequireAuth>
  );
}
