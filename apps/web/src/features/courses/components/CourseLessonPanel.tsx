'use client';

import { useEffect, useRef } from 'react';
import { CheckCircle2, Trophy } from 'lucide-react';
import { useLesson, useStartLesson } from '@/src/features/lessons';
import { useGuidedLesson } from '@/src/features/courses/useGuidedCourses';
import { useAuthStore } from '@/src/store/authStore';
import { resolveLabForDomain } from '@/src/features/labs';
import type { Domain } from '@/src/domain/course';
import { LessonContentBody } from '@/src/features/lessons/components/LessonContentBody';
import { LessonActivityPanel } from '@/src/features/lessons/components/LessonActivityPanel';
import { parseLessonActivity } from '@/src/features/lessons/lessonActivity';
import { Skeleton } from '@/src/components/ui/skeleton';
import { useTranslation } from '@/src/i18n';

function prettyKey(key: string): string {
  return key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface CourseLessonPanelProps {
  lessonId: string;
  moduleTitle?: string | null;
  moduleDomain?: Domain | null;
  position?: { n: number; total: number } | null;
  guided?: boolean;
}

export function CourseLessonPanel({
  lessonId,
  moduleTitle,
  moduleDomain,
  position,
  guided = false,
}: CourseLessonPanelProps) {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const learnerLessonQ = useLesson(guided ? null : lessonId);
  const guidedLessonQ = useGuidedLesson(guided ? lessonId : null);
  const lessonQ = guided ? guidedLessonQ : learnerLessonQ;
  const { mutate: startLesson } = useStartLesson();
  const startedFor = useRef<string | null>(null);

  useEffect(() => {
    if (guided && !isAuthenticated) return;
    const data = lessonQ.data;
    if (!data) return;
    const status = data.progress?.status;
    if (status === 'in_progress' || status === 'completed') return;
    if (startedFor.current === lessonId) return;
    startedFor.current = lessonId;
    startLesson(lessonId);
  }, [guided, isAuthenticated, lessonQ.data, lessonId, startLesson]);

  if (lessonQ.isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col p-5 sm:p-8 lg:px-10 lg:py-9">
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
          <Skeleton className="h-4 w-64" shimmer />
          <Skeleton className="mt-3 h-10 w-3/4 max-w-xl" shimmer />
          <Skeleton className="mt-8 h-24 w-full" shimmer />
          <div className="mt-10 flex gap-5">
            <Skeleton className="h-10 w-12 shrink-0" shimmer />
            <Skeleton className="h-8 w-2/3 max-w-lg" shimmer />
          </div>
          <div className="mt-6 grid flex-1 auto-rows-fr gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="min-h-[160px] w-full rounded-md" shimmer />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (lessonQ.isError || !lessonQ.data) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="rounded-md border border-line/80 bg-bg-elev/80 p-8 text-center">
          <p className="font-medium text-ink">{t('player.loadLessonError')}</p>
          <p className="mt-1 text-sm text-ink-2">{t('player.selectAnotherItem')}</p>
        </div>
      </div>
    );
  }

  const { lesson, progress } = lessonQ.data;
  const isCompleted = progress?.status === 'completed';
  const labMeta = moduleDomain ? resolveLabForDomain(moduleDomain) : null;
  const activity = parseLessonActivity(lesson.content);

  return (
    <div className="flex min-h-full flex-col p-5 sm:p-8 lg:px-10 lg:py-9">
      <div className="mx-auto w-full max-w-4xl">
        <p className="text-sm font-medium text-ink/45">
          {moduleTitle}
          {position ? (
            <>
              <span className="mx-1.5 text-ink/20">·</span>
              {t('player.lessonOf', { current: String(position.n), total: String(position.total) })}
            </>
          ) : null}
          {labMeta ? (
            <>
              <span className="mx-1.5 text-ink/20">·</span>
              {labMeta.label}
            </>
          ) : null}
          {isCompleted ? (
            <>
              <span className="mx-1.5 text-ink/20">·</span>
              <span className="text-good">{t('player.completed')}</span>
            </>
          ) : null}
        </p>

        <h1 className="mt-3 font-heading text-[1.85rem] font-medium leading-tight tracking-[-0.03em] text-ink sm:text-[2.15rem]">
          {lesson.title}
        </h1>

        <article className="mt-8">
          <LessonContentBody content={lesson.content} />
        </article>

        {activity ? <LessonActivityPanel activity={activity} /> : null}
      </div>
    </div>
  );
}

export function CourseCompletionBanner({
  streak,
  courseProgressPercent,
  achievements,
}: {
  streak?: { current: number } | null;
  courseProgressPercent: number;
  achievements: string[];
}) {
  const { t } = useTranslation();

  return (
    <div className="border-b border-good/25 bg-good-soft/70 px-5 py-3 sm:px-6">
      <div className="flex w-full flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
        <span className="inline-flex items-center gap-2 font-medium text-good">
          <CheckCircle2 className="size-4" /> {t('player.lessonMarkedComplete')}
        </span>
        {streak ? (
          <span className="text-ink/65">
            {t('player.streak')}{' '}
            <span className="font-medium text-ink">
              {t('player.streakDays', { count: String(streak.current) })}
            </span>
          </span>
        ) : null}
        <span className="text-ink/65">
          {t('player.courseProgress')}{' '}
          <span className="font-medium tabular-nums text-ink">{courseProgressPercent}%</span>
        </span>
        {achievements.length > 0 ? (
          <span className="inline-flex flex-wrap items-center gap-2 text-ink/65">
            <Trophy className="size-3.5 text-primary" />
            {achievements.map((item) => (
              <span key={item} className="rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                {prettyKey(item)}
              </span>
            ))}
          </span>
        ) : null}
      </div>
    </div>
  );
}
