import { Suspense } from 'react';
import { Spinner } from '@/src/components/ui/spinner';
import { PlatformShell } from '@/src/features/platform';
import { GuidedCoursesHome } from '@/src/features/courses/GuidedCoursesHome';

export default function GuidedCoursesPage() {
  return (
    <PlatformShell>
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <Spinner className="size-8 text-primary" />
          </div>
        }
      >
        <GuidedCoursesHome />
      </Suspense>
    </PlatformShell>
  );
}
