'use client';

import { Suspense } from 'react';
import { CreateCourseWizard } from '@/src/features/onboarding/CreateCourseWizard';
import { Skeleton } from '@/src/components/ui/skeleton';

function CreateCourseFallback() {
  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8 xl:px-10">
      <Skeleton className="h-24 w-full max-w-2xl rounded-xl" />
      <Skeleton className="h-[560px] w-full rounded-2xl" />
    </div>
  );
}

export default function CreateCoursePage() {
  return (
    <Suspense fallback={<CreateCourseFallback />}>
      <CreateCourseWizard />
    </Suspense>
  );
}
