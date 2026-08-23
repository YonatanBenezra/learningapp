'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, FlaskConical, Layers, Loader2 } from 'lucide-react';
import { ApiError } from '@/src/infrastructure/apiClient';
import { buttonClasses } from '@/src/components/ui/button';
import { learnerCoursePath } from '@/src/features/auth/learnerRoutes';
import {
  CURATED_COURSE_SLUG,
  fetchCuratedCourse,
  type CuratedCoursePublic,
} from '@/src/features/courses/curatedCoursesApi';

export function CuratedCourseBanner({ compact = false }: { compact?: boolean }) {
  const [course, setCourse] = useState<CuratedCoursePublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchCuratedCourse(CURATED_COURSE_SLUG)
      .then(setCourse)
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mb-6 flex items-center gap-2 rounded-2xl border border-line bg-bg-elev px-4 py-6 text-sm text-ink-3 dark:border-line-2">
        <Loader2 className="size-4 animate-spin" />
        Loading guided course…
      </div>
    );
  }

  if (!course) return null;

  if (compact) {
    return (
      <Link
        href={learnerCoursePath(course.id)}
        className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary-soft/40 px-5 py-4 transition hover:border-primary/35 dark:bg-primary/10"
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">5-hour guided course</p>
          <p className="mt-1 truncate font-medium text-ink">{course.title}</p>
        </div>
        <span className={buttonClasses({ size: 'sm', className: 'h-9 shrink-0 rounded-xl px-4 shadow-none' })}>
          Start
        </span>
      </Link>
    );
  }

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-soft/70 via-bg-elev to-tint-mint/40 dark:from-primary/10 dark:via-bg-elev dark:to-bg">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
            <BookOpen className="size-3.5" />
            Guided course POC
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-bg-elev/80 px-2.5 py-1 text-xs text-ink-2">
            <Clock className="size-3.5" />
            ~{course.estimatedHours ?? 5} hours
          </span>
        </div>

        <h2 className="mt-4 text-xl font-semibold tracking-tight text-ink">{course.title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-2">{course.description}</p>

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink-2">
          <span className="inline-flex items-center gap-1.5">
            <Layers className="size-3.5 text-primary" />
            {course.moduleCount} modules · {course.lessonCount} lessons
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FlaskConical className="size-3.5 text-primary" />
            {course.simulationCount ?? 4} simulations
          </span>
          <span>{course.problemCount ?? 12} MCQ exercises</span>
        </div>

        <Link
          href={learnerCoursePath(course.id)}
          className={buttonClasses({
            size: 'sm',
            className: 'mt-5 inline-flex h-10 rounded-xl px-5 shadow-none',
          })}
        >
          Start course
        </Link>
      </div>
    </section>
  );
}
