'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import { Badge, type BadgeProps } from '@/src/components/ui/badge';
import { Progress } from '@/src/components/ui/progress';
import type { Course, CourseStatus } from '@/src/domain/course';
import { learnerCoursePath } from '@/src/features/auth/learnerRoutes';
import {
  useTranslation,
  useIsRtl,
  useCategoryLabel,
  useCourseLevelLabel,
  useCourseStatusLabel,
} from '@/src/i18n';

export const statusVariant: Record<CourseStatus, BadgeProps['variant']> = {
  generating: 'warn',
  ready: 'good',
  failed: 'bad',
  completed: 'primary',
  archived: 'default',
};

export function CourseCard({ course }: { course: Course }) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const categoryLabel = useCategoryLabel(course.category);
  const levelLabel = useCourseLevelLabel(course.level);
  const status = useCourseStatusLabel(course.status);
  const isGenerating = course.status === 'generating';
  const isFailed = course.status === 'failed';

  return (
    <Link
      href={learnerCoursePath(course.id)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card transition hover:border-primary/30"
    >
      <div className="border-b border-line px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="grid size-10 place-items-center rounded-lg border border-line bg-bg-soft text-primary">
            <BookOpen className="size-4" strokeWidth={1.75} />
          </div>
          <Badge variant={statusVariant[course.status]} className="capitalize">
            {status}
          </Badge>
        </div>
        <h3 className="mt-4 line-clamp-2 text-base font-semibold leading-snug text-ink group-hover:text-primary">
          {course.title}
        </h3>
      </div>

      <div className="flex flex-1 flex-col px-5 py-4">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs font-medium text-ink-3">{t('courses.category')}</dt>
            <dd className="mt-1 font-medium text-ink-2">{categoryLabel}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-ink-3">{t('courses.level')}</dt>
            <dd className="mt-1 font-medium text-ink-2">{levelLabel}</dd>
          </div>
        </dl>

        {course.topics.length > 0 ? (
          <p className="mt-4 line-clamp-2 text-xs leading-5 text-ink-3">
            {course.topics.slice(0, 4).join(' · ')}
          </p>
        ) : null}

        <div className="mt-auto pt-5">
          {isGenerating ? (
            <div className="flex items-center gap-2 rounded-lg border border-warn/20 bg-warn-soft px-3 py-2.5 text-sm text-warn">
              <Loader2 className="size-4 animate-spin" />
              {t('courses.genInProgress')}
            </div>
          ) : isFailed ? (
            <p className="rounded-lg border border-bad/20 bg-bad-soft px-3 py-2.5 text-sm text-bad">
              {t('courses.genFailed')}
            </p>
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-medium text-ink-3">{t('courses.completion')}</span>
                <span className="font-semibold tabular-nums text-ink">
                  {course.progressPercent}%
                </span>
              </div>
              <Progress value={course.progressPercent} className="h-1" />
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-line px-5 py-3.5">
        <span className="text-sm font-medium text-ink-2">
          {isGenerating
            ? t('courses.viewStatus')
            : isFailed
              ? t('courses.viewDetails')
              : t('courses.openCourse')}
        </span>
        <span className="grid size-8 place-items-center rounded-xl border border-line bg-bg-soft text-ink-3 transition group-hover:border-primary/30 group-hover:bg-primary-soft group-hover:text-primary">
          <ArrowRight className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
        </span>
      </div>
    </Link>
  );
}

export function CourseCardCompact({ course }: { course: Course }) {
  const { t } = useTranslation();
  const categoryLabel = useCategoryLabel(course.category);
  const status = useCourseStatusLabel(course.status);

  return (
    <Link
      href={learnerCoursePath(course.id)}
      className="flex items-center gap-4 rounded-xl border border-line bg-bg-elev px-4 py-3.5 transition hover:border-primary/30 hover:bg-bg-soft"
    >
      <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-bg-soft text-primary">
        <BookOpen className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink">{course.title}</p>
        <p className="mt-0.5 text-xs text-ink-3">
          {categoryLabel} · {t('courses.completeSuffix', { percent: String(course.progressPercent) })}
        </p>
      </div>
      <Badge variant={statusVariant[course.status]} className="capitalize">
        {status}
      </Badge>
    </Link>
  );
}
