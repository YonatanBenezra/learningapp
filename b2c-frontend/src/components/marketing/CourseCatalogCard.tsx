'use client';

import Link from 'next/link';
import { ArrowRight, Bookmark, BookOpen, Clock, Users } from 'lucide-react';
import { learnerCoursePath } from '@/src/features/auth/learnerRoutes';
import { useIsRtl, useTranslation } from '@/src/i18n';
import { Tooltip } from '@/src/components/ui/tooltip';
import { cn } from '@/src/lib/utils';

export type CatalogCourse = {
  id: string;
  title: string;
  description: string;
  price: number;
  lessons: number;
  students: number;
  category: string;
  level: string;
};

function formatLevel(level: string): string {
  return level.replace(/\b\w/g, (char) => char.toUpperCase());
}

interface CourseCatalogCardProps {
  course: CatalogCourse;
  bookmarked?: boolean;
  onToggleBookmark?: () => void;
  enrolled?: boolean;
  variant?: 'grid' | 'list';
}

export function CourseCatalogCard({
  course,
  bookmarked = false,
  onToggleBookmark,
  enrolled = false,
  variant = 'grid',
}: CourseCatalogCardProps) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const href = enrolled ? learnerCoursePath(course.id) : `/courses/${course.id}`;
  const ctaLabel = enrolled ? t('marketplace.continue') : t('marketplace.viewCourse');

  const meta = (
    <>
      <span className="inline-flex items-center gap-1.5">
        <BookOpen className="size-4 text-ink-3" />
        {course.lessons === 1
          ? t('marketplace.lessonCountOne')
          : t('marketplace.lessonCountMany', { count: String(course.lessons) })}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Users className="size-4 text-ink-3" />
        {t('marketplace.enrolled', { count: String(course.students) })}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock className="size-4 text-ink-3" />
        {t('marketplace.selfPaced')}
      </span>
    </>
  );

  if (variant === 'list') {
    return (
      <article className="relative overflow-hidden rounded-lg border border-line bg-bg-elev shadow-card transition-colors hover:z-20 hover:border-line-2">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
              <span>{course.category}</span>
              <span aria-hidden="true">·</span>
              <span>{formatLevel(course.level)}</span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-ink sm:text-xl">{course.title}</h3>
            {course.description ? (
              <p className="mt-1 line-clamp-2 text-base leading-7 text-ink-2">{course.description}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">{meta}</div>
          </div>

          <div className="flex shrink-0 items-center gap-3 border-t border-line pt-4 sm:border-t-0 sm:pt-0">
            <div className="min-w-[72px] text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-3">{t('marketplace.price')}</p>
              <p className="text-xl font-semibold tabular-nums text-ink">${course.price.toFixed(2)}</p>
            </div>
            <Tooltip content={bookmarked ? t('marketplace.removeBookmark') : t('marketplace.bookmarkHint')}>
              <button
                type="button"
                aria-label={bookmarked ? t('marketplace.removeBookmark') : t('marketplace.bookmarkCourse')}
                aria-pressed={bookmarked}
                onClick={onToggleBookmark}
                className="grid size-9 place-items-center rounded-md border border-line bg-bg-soft text-ink-2 transition hover:border-line-2 hover:text-ink"
              >
                <Bookmark className={cn('size-4', bookmarked && 'fill-primary text-primary')} />
              </button>
            </Tooltip>
            <Tooltip content={enrolled ? t('marketplace.openEnrolled') : t('marketplace.viewDetailsEnroll')}>
              <Link
                href={href}
                className={cn(
                  'inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-base font-semibold transition-colors',
                  enrolled
                    ? 'bg-primary text-white hover:bg-primary-dark'
                    : 'border border-line bg-bg-soft text-ink hover:border-primary hover:text-primary',
                )}
              >
                {ctaLabel}
                <ArrowRight className={cn('size-4', isRtl && 'rotate-180')} />
              </Link>
            </Tooltip>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-lg border border-line bg-bg-elev shadow-card transition-colors hover:z-20 hover:border-line-2">
      <div className="border-b border-line bg-bg-soft px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-wide text-ink-3">
            <span>{course.category}</span>
            <span aria-hidden="true" className="hidden sm:inline">
              ·
            </span>
            <span>{formatLevel(course.level)}</span>
          </div>
          <Tooltip content={bookmarked ? t('marketplace.removeBookmark') : t('marketplace.bookmarkHint')}>
            <button
              type="button"
              aria-label={bookmarked ? t('marketplace.removeBookmark') : t('marketplace.bookmarkCourse')}
              aria-pressed={bookmarked}
              onClick={onToggleBookmark}
              className="grid size-8 place-items-center rounded-md border border-line bg-bg-elev text-ink-2 transition hover:border-line-2 hover:text-ink"
            >
              <Bookmark className={cn('size-3.5', bookmarked && 'fill-primary text-primary')} />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-ink sm:text-xl">{course.title}</h3>
        {course.description ? (
          <p className="mt-2 line-clamp-3 flex-1 text-base leading-7 text-ink-2">{course.description}</p>
        ) : (
          <div className="flex-1" />
        )}

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-4 text-sm text-ink-2">
          {meta}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line bg-bg-soft px-4 py-3 sm:px-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-3">{t('marketplace.price')}</p>
          <p className="text-xl font-semibold tabular-nums text-ink">${course.price.toFixed(2)}</p>
        </div>
        <Tooltip content={enrolled ? t('marketplace.openEnrolled') : t('marketplace.viewDetailsEnroll')}>
          <Link
            href={href}
            className={cn(
              'inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-base font-semibold transition-colors',
              enrolled
                ? 'bg-primary text-white hover:bg-primary-dark'
                : 'border border-line bg-bg-elev text-ink hover:border-primary hover:text-primary',
            )}
          >
            {ctaLabel}
            <ArrowRight className={cn('size-4', isRtl && 'rotate-180')} />
          </Link>
        </Tooltip>
      </div>
    </article>
  );
}
