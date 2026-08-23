'use client';

import Link from 'next/link';
import { BookOpen, Clock, FlaskConical, Layers } from 'lucide-react';
import { buttonClasses } from '@/src/components/ui/button';
import { guidedCoursePath } from '@/src/features/auth/learnerRoutes';
import type { CuratedCoursePublic } from '@/src/features/courses/curatedCoursesApi';

export function GuidedCourseCard({ course }: { course: CuratedCoursePublic }) {
  const startHref = guidedCoursePath(course.id);

  return (
    <article className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-soft/70 via-bg-elev to-tint-mint/40 dark:from-primary/10 dark:via-bg-elev dark:to-bg">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
            <BookOpen className="size-3.5" />
            Guided course
          </span>
          {course.estimatedHours ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-bg-elev/80 px-2.5 py-1 text-xs text-ink-2">
              <Clock className="size-3.5" />~{course.estimatedHours} hours
            </span>
          ) : null}
          <span className="rounded-full bg-bg-elev/80 px-2.5 py-1 text-xs capitalize text-ink-2">
            {course.level}
          </span>
        </div>

        <h2 className="mt-4 text-xl font-semibold tracking-tight text-ink">{course.title}</h2>
        <p className="mt-2 text-sm leading-6 text-ink-2">{course.description}</p>

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink-2">
          <span className="inline-flex items-center gap-1.5">
            <Layers className="size-3.5 text-primary" />
            {course.moduleCount} modules · {course.lessonCount} lessons
          </span>
          {course.simulationCount ? (
            <span className="inline-flex items-center gap-1.5">
              <FlaskConical className="size-3.5 text-primary" />
              {course.simulationCount} simulations
            </span>
          ) : null}
          {course.problemCount ? <span>{course.problemCount} MCQ exercises</span> : null}
        </div>

        <Link
          href={startHref}
          className={buttonClasses({
            size: 'sm',
            className: 'mt-5 inline-flex h-10 rounded-xl px-5 shadow-none',
          })}
        >
          Start course
        </Link>
      </div>
    </article>
  );
}
