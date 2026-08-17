'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useCourse } from '@/src/features/courses';
import { CoursePlayer } from '@/src/features/courses/components/CoursePlayer';
import {
  CourseGeneratingPanel,
  CourseGenerationFailedPanel,
} from '@/src/features/courses/components/CourseGeneratingPanel';
import { buttonClasses } from '@/src/components/ui/button';
import { Skeleton } from '@/src/components/ui/skeleton';
import { useIsRtl, useTranslation } from '@/src/i18n';

export function CourseOverview({ courseId }: { courseId: string }) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const courseQ = useCourse(courseId);
  const course = courseQ.data?.course;
  const status = course?.status;

  if (courseQ.isLoading) {
    return (
      <Shell>
        <Skeleton className="h-4 w-40" shimmer />
        <div className="mx-auto mt-16 flex max-w-3xl flex-col items-center">
          <Skeleton className="size-[148px] rounded-full sm:size-[168px]" shimmer />
          <Skeleton className="mt-8 h-8 w-64" shimmer />
          <Skeleton className="mt-3 h-4 w-48" shimmer />
          <div className="mt-8 flex w-full max-w-2xl justify-between">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="size-8 rounded-full" shimmer />
            ))}
          </div>
          <div className="mt-10 w-full space-y-2">
            <Skeleton className="h-12 w-full rounded-md" shimmer />
            <Skeleton className="h-12 w-full rounded-md" shimmer />
            <Skeleton className="h-12 w-full rounded-md" shimmer />
          </div>
        </div>
      </Shell>
    );
  }

  if (courseQ.isError || !course) {
    return (
      <Shell>
        <Link
          href="/my-courses"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
          {t('player.backToCourseList')}
        </Link>
        <div className="mx-auto mt-16 max-w-md text-center">
          <p className="text-lg font-medium text-ink">{t('player.courseNotFound')}</p>
          <p className="mt-2 text-sm leading-6 text-ink/65">{t('player.courseNotFoundDesc')}</p>
          <Link
            href="/my-courses"
            className={buttonClasses({
              size: 'lg',
              className: 'mt-6 h-11 rounded-md px-5 text-sm font-medium shadow-none',
            })}
          >
            {t('player.returnToCourseList')}
          </Link>
        </div>
      </Shell>
    );
  }

  if (status === 'generating') {
    return (
      <Shell>
        <CourseGeneratingPanel course={course} />
      </Shell>
    );
  }

  if (status === 'failed') {
    return (
      <Shell>
        <CourseGenerationFailedPanel course={course} />
      </Shell>
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
      <CoursePlayer courseId={courseId} course={course} />
    </Suspense>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="w-full p-4 sm:p-6 lg:p-8 xl:px-10">{children}</div>;
}
