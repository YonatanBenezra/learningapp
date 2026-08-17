'use client';

import Link from 'next/link';
import { BookOpen, Loader2 } from 'lucide-react';
import type { BadgeProps } from '@/src/components/ui/badge';
import { buttonClasses } from '@/src/components/ui/button';
import { Progress } from '@/src/components/ui/progress';
import type { Course, CourseStatus } from '@/src/domain/course';
import { learnerCoursePath } from '@/src/features/auth/learnerRoutes';
import { AI_CATEGORY_OPTIONS } from '@/src/constants/aiCategories';
import { cn } from '@/src/lib/utils';
import {
  useTranslation,
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

function statusStyle(status: CourseStatus, progressPercent: number) {
  if (status === 'generating') return 'bg-warn/15 text-warn';
  if (status === 'failed') return 'bg-bad/15 text-bad';
  if (status === 'completed' || progressPercent >= 100) return 'bg-good/15 text-good';
  return 'bg-primary/15 text-primary';
}

function statusDot(status: CourseStatus, progressPercent: number) {
  if (status === 'generating') return 'bg-warn';
  if (status === 'failed') return 'bg-bad';
  if (status === 'completed' || progressPercent >= 100) return 'bg-good';
  return 'bg-primary';
}

export function CourseCard({ course }: { course: Course }) {
  const { t } = useTranslation();
  const categoryLabel = useCategoryLabel(course.category);
  const levelLabel = useCourseLevelLabel(course.level);
  const status = useCourseStatusLabel(course.status);
  const isGenerating = course.status === 'generating';
  const isFailed = course.status === 'failed';
  const category = AI_CATEGORY_OPTIONS.find((option) => option.name === course.category);
  const Icon = category?.icon ?? BookOpen;
  const tags = (course.topics.length > 0 ? course.topics : [levelLabel]).slice(0, 4);
  const progress = Math.max(0, Math.min(100, course.progressPercent));
  const ctaLabel = isGenerating
    ? t('courses.viewStatus')
    : isFailed
      ? t('courses.viewDetails')
      : progress > 0 && progress < 100
        ? t('dashboard.continueLearning')
        : t('courses.openCourse');

  return (
    <article className="flex h-full flex-col rounded-md border border-line/80 bg-bg-elev/90 p-5 transition-colors hover:border-primary/35 hover:bg-bg-elev">
      <Link href={learnerCoursePath(course.id)} className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                'grid size-10 shrink-0 place-items-center rounded-md',
                category?.iconBg ?? 'bg-primary-soft',
              )}
            >
              <Icon
                className={cn('size-5', category?.iconColor ?? 'text-primary')}
                strokeWidth={1.75}
              />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{categoryLabel}</p>
              <p className="mt-0.5 text-xs text-ink/45">{levelLabel}</p>
            </div>
          </div>
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium',
              statusStyle(course.status, progress),
            )}
          >
            {isGenerating ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <span className={cn('size-1.5 rounded-full', statusDot(course.status, progress))} />
            )}
            {status}
          </span>
        </div>

        <h3 className="mt-5 line-clamp-2 text-xl font-medium leading-snug text-ink">{course.title}</h3>

        {tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto pt-6">
          {isGenerating ? (
            <p className="mb-4 flex items-center gap-2 text-sm text-ink/65">
              <Loader2 className="size-4 animate-spin text-primary" />
              {t('courses.genInProgress')}
            </p>
          ) : isFailed ? (
            <p className="mb-4 text-sm leading-6 text-bad">
              {course.failureReason ?? t('courses.genFailed')}
            </p>
          ) : (
            <div className="mb-4">
              <p className="mb-1.5 text-xs font-medium text-ink">
                {t('marketing.catalogComplete', { percent: String(progress) })}
              </p>
              <Progress value={progress} className="h-2 rounded-full bg-primary/20" />
            </div>
          )}
          <span
            className={buttonClasses({
              size: 'lg',
              variant: isFailed ? 'outline' : 'primary',
              className: cn(
                'h-11 w-full rounded-md text-sm font-medium shadow-none',
                isFailed && 'bg-transparent',
              ),
            })}
          >
            {ctaLabel}
          </span>
        </div>
      </Link>
    </article>
  );
}

export function CourseCardCompact({ course }: { course: Course }) {
  const { t } = useTranslation();
  const categoryLabel = useCategoryLabel(course.category);
  const status = useCourseStatusLabel(course.status);
  const category = AI_CATEGORY_OPTIONS.find((option) => option.name === course.category);
  const Icon = category?.icon ?? BookOpen;
  const progress = Math.max(0, Math.min(100, course.progressPercent));

  return (
    <Link
      href={learnerCoursePath(course.id)}
      className="flex items-center gap-4 rounded-md border border-line/80 bg-bg-elev/90 px-4 py-3.5 transition-colors hover:border-primary/35 hover:bg-bg-elev"
    >
      <span
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-md',
          category?.iconBg ?? 'bg-primary-soft',
        )}
      >
        <Icon className={cn('size-5', category?.iconColor ?? 'text-primary')} strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink">{course.title}</p>
        <p className="mt-0.5 text-xs text-ink/45">
          {categoryLabel} · {t('courses.completeSuffix', { percent: String(progress) })}
        </p>
      </div>
      <span
        className={cn(
          'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium',
          statusStyle(course.status, progress),
        )}
      >
        <span className={cn('size-1.5 rounded-full', statusDot(course.status, progress))} />
        {status}
      </span>
    </Link>
  );
}
