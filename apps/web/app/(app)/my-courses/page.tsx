'use client';

import { Suspense } from 'react';
import { MyCoursesPage } from '@/src/features/courses/MyCoursesPage';
import { Skeleton } from '@/src/components/ui/skeleton';

function MyCoursesFallback() {
  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8 xl:px-10">
      <Skeleton className="h-14 w-full max-w-xl" />
      <Skeleton className="h-14 rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<MyCoursesFallback />}>
      <MyCoursesPage />
    </Suspense>
  );
}
