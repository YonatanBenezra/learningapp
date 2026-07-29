'use client';

import Link from 'next/link';
import { ArrowRight, Bookmark, BookOpen, Users } from 'lucide-react';
import { learnerCoursePath } from '@/src/features/auth/learnerRoutes';
import { cn } from '@/src/lib/utils';

export type CatalogCourse = {
  id: string;
  title: string;
  description: string;
  price: number;
  instructor: string;
  lessons: number;
  students: number;
  category: string;
  level: string;
};

function instructorInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function formatLevel(level: string): string {
  return level.replace(/\b\w/g, (char) => char.toUpperCase());
}

interface CourseCatalogCardProps {
  course: CatalogCourse;
  bookmarked?: boolean;
  onToggleBookmark?: () => void;
  enrolled?: boolean;
}

export function CourseCatalogCard({
  course,
  bookmarked = false,
  onToggleBookmark,
  enrolled = false,
}: CourseCatalogCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border border-line bg-bg-elev shadow-card transition-shadow hover:shadow-lift">
      <div className="flex flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-md bg-primary-deep px-2.5 py-1 text-xs font-semibold text-white">
            {course.category}
          </span>
          <button
            type="button"
            aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark course'}
            aria-pressed={bookmarked}
            onClick={onToggleBookmark}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-bg-soft text-ink-2 transition hover:border-primary hover:text-primary"
          >
            <Bookmark className={cn('size-4', bookmarked && 'fill-primary text-primary')} />
          </button>
        </div>

        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-bg-soft text-xs font-semibold text-ink-2 ring-1 ring-line">
              {instructorInitials(course.instructor)}
            </span>
            <span className="truncate text-sm text-ink-2">{course.instructor}</span>
          </div>
          <div className="shrink-0 text-right leading-tight">
            <span className="block text-base font-bold text-primary">
              ${course.price.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="mt-4 border-b border-line pb-3">
          <h3 className="line-clamp-2 text-lg font-bold leading-snug text-ink">{course.title}</h3>

          {course.description ? (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-2">
              {course.description}
            </p>
          ) : null}
        </div>

        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-ink-3">
          {formatLevel(course.level)}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink-2">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="size-4 text-ink-3" />
            {course.lessons} Lessons
          </span>
          <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-4 text-ink-3" />
            {course.students} Students
          </span>
        </div>

        <Link
          href={enrolled ? learnerCoursePath(course.id) : `/courses/${course.id}`}
          className={cn(
            'mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-white transition-colors',
            enrolled
              ? 'bg-primary hover:bg-primary-dark'
              : 'bg-[#6C757D] hover:bg-[#5a6268] dark:bg-ink-3 dark:hover:bg-ink-2',
          )}
        >
          {enrolled ? 'Continue learning' : 'Preview This Course'}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}
