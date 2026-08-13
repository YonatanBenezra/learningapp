'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { useCourse } from '@/src/features/courses';
import { CoursePlayer } from '@/src/features/courses/components/CoursePlayer';
import { Button } from '@/src/components/ui/button';
import { BrandWordmark } from '@/src/components/ui/brand-wordmark';
import { Skeleton } from '@/src/components/ui/skeleton';
import { useIsRtl, useTranslation } from '@/src/i18n';

export function CourseOverview({ courseId }: { courseId: string }) {
  const { t } = useTranslation();
  const courseQ = useCourse(courseId);
  const course = courseQ.data?.course;
  const status = course?.status;

  if (courseQ.isLoading) {
    return (
      <Shell>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="mt-4 h-[520px] w-full rounded-xl" />
      </Shell>
    );
  }

  if (courseQ.isError || !course) {
    return (
      <Shell>
        <PageNav title={t('player.courseNotFound')} />
        <div className="mt-6 rounded-xl border border-line bg-bg-elev p-10 text-center shadow-soft">
          <h1 className="text-xl font-bold text-ink">{t('player.courseNotFound')}</h1>
          <p className="mt-2 text-sm text-ink-2">{t('player.courseNotFoundDesc')}</p>
          <Link href="/my-courses" className="mt-6 inline-block">
            <Button variant="soft">{t('player.returnToCourseList')}</Button>
          </Link>
        </div>
      </Shell>
    );
  }

  if (status === 'generating') {
    return (
      <Shell>
        <PageNav title={course.title} />
        <div className="mt-6 rounded-xl border border-line bg-bg-elev p-10 text-center shadow-soft">
          <div className="mx-auto grid size-14 place-items-center rounded-xl border border-line bg-primary-soft text-primary">
            <Loader2 className="size-7 animate-spin" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-ink">{t('player.genInProgress')}</h1>
          <p className="mx-auto mt-2 max-w-[42ch] text-sm text-ink-2">{t('player.genInProgressDesc')}</p>
        </div>
      </Shell>
    );
  }

  if (status === 'failed') {
    return (
      <Shell>
        <PageNav title={course.title} />
        <div className="mt-6 rounded-xl border border-line bg-bg-elev p-10 text-center shadow-soft">
          <div className="mx-auto grid size-14 place-items-center rounded-xl border border-bad/20 bg-bad-soft text-bad">
            <X className="size-7" strokeWidth={2.4} />
          </div>
          <h1 className="mt-4 text-xl font-bold text-ink">{t('player.genFailed')}</h1>
          <p className="mx-auto mt-2 max-w-[42ch] text-sm text-ink-2">
            {course.failureReason ?? t('player.genFailedDefault')}
          </p>
          <Link href="/create-course" className="mt-6 inline-block">
            <Button>{t('player.createNewCourse')}</Button>
          </Link>
        </div>
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

function PageNav({ title }: { title: string }) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();

  return (
    <div className="border-b border-line pb-5">
      <Link
        href="/my-courses"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition hover:text-primary"
      >
        <ArrowLeft className="size-4" /> {t('player.backToCourseList')}
      </Link>
      <nav className="mt-3 flex flex-wrap items-center gap-1.5 text-sm text-ink-3">
        <Link href="/dashboard" className="transition hover:text-primary">
          <BrandWordmark size="sm" className="font-semibold" />
        </Link>
        <ChevronRight className={`size-4${isRtl ? ' rotate-180' : ''}`} />
        <Link href="/my-courses" className="transition hover:text-primary">
          {t('player.myCourses')}
        </Link>
        <ChevronRight className={`size-4${isRtl ? ' rotate-180' : ''}`} />
        <span className="line-clamp-1 font-medium text-ink">{title}</span>
      </nav>
    </div>
  );
}
