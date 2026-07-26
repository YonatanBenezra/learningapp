'use client';

import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Spinner } from '@/src/components/ui/spinner';
import { cn } from '@/src/lib/utils';
import { formatMoney } from '@/src/domain/instructor';
import { useInstructorCourses } from '@/src/features/instructor/useInstructor';

function statusLabel(status: string, isPublished: boolean) {
  if (status === 'generating') return 'Generating';
  if (status === 'failed') return 'Failed';
  if (isPublished) return 'Published';
  if (status === 'ready') return 'Draft';
  return status;
}

export function InstructorCoursesPage() {
  const { data, isLoading, isError, refetch } = useInstructorCourses();
  const courses = data?.courses ?? [];

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-line bg-bg-elev p-10 text-center">
        <p className="font-semibold text-ink">Could not load your courses.</p>
        <Button variant="soft" className="mt-4 rounded-lg" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">My courses</h2>
          <p className="mt-1 text-sm text-ink-2">Courses you create and sell on the marketplace.</p>
        </div>
        <Link href="/instructor/courses/new">
          <Button className="rounded-lg bg-primary hover:bg-primary-dark">
            <Plus className="size-4" />
            Create course
          </Button>
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-bg-elev p-12 text-center">
          <p className="text-lg font-semibold text-ink">No instructor courses yet</p>
          <p className="mt-2 text-sm text-ink-2">
            Create your first course, set a price, and publish it for learners to buy.
          </p>
          <Link href="/instructor/courses/new" className="mt-6 inline-block">
            <Button className="rounded-lg bg-primary hover:bg-primary-dark">
              Create your first course
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <article
              key={course.id}
              className="rounded-lg border border-line bg-bg-elev p-6 shadow-soft"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'rounded-lg px-3 py-1 text-xs font-semibold',
                        course.isPublished && 'bg-good-soft text-good',
                        !course.isPublished && course.status === 'ready' && 'bg-warn-soft text-warn',
                        course.status === 'generating' && 'bg-primary-soft text-primary',
                        course.status === 'failed' && 'bg-bad-soft text-bad',
                      )}
                    >
                      {statusLabel(course.status, course.isPublished)}
                    </span>
                    <span className="text-xs uppercase tracking-wide text-ink-3">
                      {course.category} · {course.level}
                    </span>
                  </div>
                  <h3 className="mt-3 text-xl font-bold text-ink">{course.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-ink-2">{course.description}</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-ink-2">
                    <span>
                      Price:{' '}
                      <strong className="text-ink">
                        {formatMoney(course.priceCents, course.currency)}
                      </strong>
                    </span>
                    <span>
                      Sales: <strong className="text-ink">{course.enrollmentCount}</strong>
                    </span>
                    <span>
                      Revenue:{' '}
                      <strong className="text-ink">
                        {formatMoney(course.revenueCents, course.currency)}
                      </strong>
                    </span>
                  </div>
                </div>
                <Link href={`/instructor/courses/${course.id}`}>
                  <Button variant="soft" className="rounded-lg">
                    Manage
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default InstructorCoursesPage;
