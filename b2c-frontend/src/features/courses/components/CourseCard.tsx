import Link from 'next/link';
import { ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import { Badge, type BadgeProps } from '@/src/components/ui/badge';
import { Progress } from '@/src/components/ui/progress';
import type { Course, CourseStatus } from '@/src/domain/course';
import { learnerCoursePath } from '@/src/features/auth/learnerRoutes';
import { cn } from '@/src/lib/utils';

export const statusVariant: Record<CourseStatus, BadgeProps['variant']> = {
  generating: 'warn',
  ready: 'good',
  failed: 'bad',
  completed: 'primary',
  archived: 'default',
};

const statusLabel: Record<CourseStatus, string> = {
  generating: 'Generating',
  ready: 'Ready',
  failed: 'Failed',
  completed: 'Completed',
  archived: 'Archived',
};

function levelLabel(level: Course['level']) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function CourseCard({ course }: { course: Course }) {
  const isGenerating = course.status === 'generating';
  const isFailed = course.status === 'failed';

  return (
    <Link
      href={learnerCoursePath(course.id)}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-bg-elev shadow-soft transition hover:border-primary/30 hover:shadow-card"
    >
      <div className="border-b border-line bg-bg-soft/70 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="grid size-10 place-items-center rounded-lg border border-line bg-bg-elev text-primary">
            <BookOpen className="size-4" strokeWidth={1.75} />
          </div>
          <Badge variant={statusVariant[course.status]} className="capitalize">
            {statusLabel[course.status]}
          </Badge>
        </div>
        <h3 className="mt-4 line-clamp-2 text-base font-semibold leading-snug text-ink group-hover:text-primary">
          {course.title}
        </h3>
      </div>

      <div className="flex flex-1 flex-col px-5 py-4">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
              Category
            </dt>
            <dd className="mt-1 font-medium text-ink-2">{course.category}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
              Level
            </dt>
            <dd className="mt-1 font-medium capitalize text-ink-2">{levelLabel(course.level)}</dd>
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
              Course generation in progress
            </div>
          ) : isFailed ? (
            <p className="rounded-lg border border-bad/20 bg-bad-soft px-3 py-2.5 text-sm text-bad">
              Generation failed. Review course details to continue.
            </p>
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-[0.08em] text-ink-3">
                  Completion
                </span>
                <span className="font-semibold tabular-nums text-ink">
                  {course.progressPercent}%
                </span>
              </div>
              <Progress value={course.progressPercent} className="h-1.5" />
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-line bg-bg-soft/50 px-5 py-3.5">
        <span className="text-sm font-medium text-ink-2">
          {isGenerating ? 'View status' : isFailed ? 'View details' : 'Open course'}
        </span>
        <span className="grid size-8 place-items-center rounded-lg border border-line bg-bg-elev text-ink-3 transition group-hover:border-primary/20 group-hover:text-primary">
          <ArrowRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}

export function CourseCardCompact({ course }: { course: Course }) {
  return (
    <Link
      href={learnerCoursePath(course.id)}
      className="flex items-center gap-4 rounded-xl border border-line bg-bg-elev px-4 py-3.5 shadow-soft transition hover:border-primary/30 hover:bg-bg-soft"
    >
      <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-bg-soft text-primary">
        <BookOpen className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink">{course.title}</p>
        <p className="mt-0.5 text-xs text-ink-3">
          {course.category} · {course.progressPercent}% complete
        </p>
      </div>
      <Badge variant={statusVariant[course.status]} className="capitalize">
        {statusLabel[course.status]}
      </Badge>
    </Link>
  );
}

export { statusLabel, levelLabel };
