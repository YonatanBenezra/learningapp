'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Loader2, Pencil, Trash2 } from 'lucide-react';
import { useTranslation, useCourseLevelLabel, useCategoryLabel } from '@/src/i18n';
import { cn } from '@/src/lib/utils';
import { formatMoney, type InstructorCourse } from '@/src/domain/instructor';

function useInstructorStatusLabel(status: string, isPublished: boolean) {
  const { t } = useTranslation();
  if (status === 'generating') return t('instructor.generating');
  if (status === 'failed') return t('instructor.statusFailed');
  if (isPublished) return t('instructor.published');
  if (status === 'ready') return t('instructor.statusDraft');
  return status;
}

function statusClass(status: string, isPublished: boolean) {
  if (isPublished) return 'bg-good-soft text-good';
  if (status === 'ready') return 'bg-warn-soft text-warn';
  if (status === 'generating') return 'bg-primary-soft text-primary';
  if (status === 'failed') return 'bg-bad-soft text-bad';
  return 'bg-bg-soft text-ink-2';
}

interface InstructorCourseCardProps {
  course: InstructorCourse;
  onDelete: (course: InstructorCourse) => void;
  isDeleting?: boolean;
}

export function InstructorCourseCard({ course, onDelete, isDeleting }: InstructorCourseCardProps) {
  const { t } = useTranslation();
  const categoryLabel = useCategoryLabel(course.category);
  const levelLabel = useCourseLevelLabel(course.level as 'beginner' | 'intermediate' | 'advanced');
  const statusLabel = useInstructorStatusLabel(course.status, course.isPublished);
  const isGenerating = course.status === 'generating';

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-line bg-bg-elev transition hover:border-primary/30">
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
        <Link
          href={`/instructor/courses/${course.id}`}
          aria-label={t('instructor.editCourse', { title: course.title })}
          className="grid size-9 place-items-center rounded-lg border border-line bg-bg-elev text-ink-2 transition hover:border-primary/30 hover:text-primary"
        >
          <Pencil className="size-4" />
        </Link>
        <button
          type="button"
          aria-label={t('instructor.deleteCourse', { title: course.title })}
          disabled={isDeleting}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onDelete(course);
          }}
          className="grid size-9 place-items-center rounded-lg border border-line bg-bg-elev text-ink-2 transition hover:border-bad/30 hover:bg-bad-soft hover:text-bad disabled:opacity-50"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <Link href={`/instructor/courses/${course.id}`} className="flex flex-1 flex-col">
        <div className="border-b border-line bg-bg-soft/70 px-5 py-4">
          <div className="flex items-start justify-between gap-3 pr-16 sm:pr-20">
            <div className="grid size-10 place-items-center rounded-lg border border-line bg-bg-elev text-primary">
              {isGenerating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <BookOpen className="size-4" strokeWidth={1.75} />
              )}
            </div>
            <span
              className={cn(
                'rounded-lg px-3 py-1 text-xs font-semibold',
                statusClass(course.status, course.isPublished),
              )}
            >
              {statusLabel}
            </span>
          </div>
          <h3 className="mt-4 line-clamp-2 text-base font-semibold leading-snug text-ink group-hover:text-primary">
            {course.title}
          </h3>
          <p className="mt-1 text-xs uppercase tracking-wide text-ink-3">
            {categoryLabel} · {levelLabel}
          </p>
        </div>

        <div className="flex flex-1 flex-col px-5 py-4">
          <p className="line-clamp-3 text-sm leading-6 text-ink-2">
            {course.description || t('instructor.noDescription')}
          </p>

          <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                {t('instructor.price')}
              </dt>
              <dd className="mt-1 font-semibold text-ink">
                {formatMoney(course.priceCents, course.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                {t('instructor.salesLabel')}
              </dt>
              <dd className="mt-1 font-semibold text-ink">{course.enrollmentCount}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                {t('instructor.revenueLabel')}
              </dt>
              <dd className="mt-1 font-semibold text-ink">
                {formatMoney(course.revenueCents, course.currency)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex items-center justify-between border-t border-line bg-bg-soft/50 px-5 py-3.5">
          <span className="text-sm font-medium text-ink-2">{t('instructor.manageCourse')}</span>
          <span className="grid size-8 place-items-center rounded-lg border border-line bg-bg-elev text-ink-3 transition group-hover:border-primary/20 group-hover:text-primary">
            <ArrowRight className="size-4" />
          </span>
        </div>
      </Link>
    </article>
  );
}

export default InstructorCourseCard;
