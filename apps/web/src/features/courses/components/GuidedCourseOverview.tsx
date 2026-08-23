'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useGuidedCourse } from '@/src/features/courses/useGuidedCourses';
import { CoursePlayer } from '@/src/features/courses/components/CoursePlayer';
import { guidedCoursesPath } from '@/src/features/auth/learnerRoutes';
import { buttonClasses } from '@/src/components/ui/button';
import { Skeleton } from '@/src/components/ui/skeleton';

export function GuidedCourseOverview({ courseId }: { courseId: string }) {
  const courseQ = useGuidedCourse(courseId);
  const course = courseQ.data?.course;

  if (courseQ.isLoading) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8 xl:px-10">
        <Skeleton className="h-4 w-40" shimmer />
        <div className="mx-auto mt-16 flex max-w-3xl flex-col items-center">
          <Skeleton className="size-[148px] rounded-full sm:size-[168px]" shimmer />
          <Skeleton className="mt-8 h-8 w-64" shimmer />
          <Skeleton className="mt-3 h-4 w-48" shimmer />
        </div>
      </div>
    );
  }

  if (courseQ.isError || !course) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8 xl:px-10">
        <Link
          href={guidedCoursesPath()}
          className="inline-flex items-center gap-2 text-sm font-medium text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" />
          Back to guided courses
        </Link>
        <div className="mx-auto mt-16 max-w-md text-center">
          <p className="text-lg font-medium text-ink">Course not found</p>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            This guided course may have been removed or is not published yet.
          </p>
          <Link
            href={guidedCoursesPath()}
            className={buttonClasses({
              size: 'lg',
              className: 'mt-6 h-11 rounded-md px-5 text-sm font-medium shadow-none',
            })}
          >
            Browse guided courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <CoursePlayer courseId={courseId} course={course} guided />
    </Suspense>
  );
}
