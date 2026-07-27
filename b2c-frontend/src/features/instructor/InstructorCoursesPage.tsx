'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Skeleton } from '@/src/components/ui/skeleton';
import { ApiError } from '@/src/infrastructure/apiClient';
import type { InstructorCourse } from '@/src/domain/instructor';
import {
  useDeleteInstructorCourse,
  useInstructorCourses,
} from '@/src/features/instructor/useInstructor';
import { InstructorCourseCard } from '@/src/features/instructor/InstructorCourseCard';
import { DeleteInstructorCourseDialog } from '@/src/features/instructor/DeleteInstructorCourseDialog';

function InstructorCoursesSkeleton() {
  return (
    <div className="min-h-full bg-gradient-to-b from-primary/[0.04] via-bg to-bg">
      <div className="space-y-8 p-4 sm:p-6 lg:p-8 xl:px-10">
        <section className="rounded-lg border border-line bg-bg-elev p-6 shadow-soft sm:p-8">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="mt-5 h-10 w-56" />
          <Skeleton className="mt-3 h-5 w-full max-w-xl" />
        </section>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-lg border border-line bg-bg-elev shadow-soft"
            >
              <div className="border-b border-line bg-bg-soft/70 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <Skeleton className="size-10 rounded-lg" />
                  <Skeleton className="h-6 w-20 rounded-lg" />
                </div>
                <Skeleton className="mt-4 h-5 w-full" />
                <Skeleton className="mt-2 h-4 w-32" />
              </div>
              <div className="space-y-3 px-5 py-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="border-t border-line bg-bg-soft/50 px-5 py-3.5">
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function InstructorCoursesPage() {
  const { data, isLoading, isError, refetch } = useInstructorCourses();
  const deleteCourse = useDeleteInstructorCourse();
  const [courseToDelete, setCourseToDelete] = useState<InstructorCourse | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const courses = data?.courses ?? [];

  if (isLoading) {
    return <InstructorCoursesSkeleton />;
  }

  if (isError) {
    return (
      <div className="min-h-full bg-gradient-to-b from-primary/[0.04] via-bg to-bg p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg border border-line bg-bg-elev p-10 text-center shadow-soft">
          <p className="font-semibold text-ink">Could not load your courses.</p>
          <Button variant="soft" className="mt-4 rounded-lg" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  function openDeleteDialog(course: InstructorCourse) {
    setDeleteError(null);
    setCourseToDelete(course);
  }

  function closeDeleteDialog() {
    if (deleteCourse.isPending) return;
    setCourseToDelete(null);
    setDeleteError(null);
  }

  function confirmDelete() {
    if (!courseToDelete) return;

    setDeleteError(null);
    deleteCourse.mutate(courseToDelete.id, {
      onSuccess: () => {
        setCourseToDelete(null);
        setDeleteError(null);
      },
      onError: (err) => {
        if (err instanceof ApiError) {
          setDeleteError(err.message);
          return;
        }
        setDeleteError('Could not delete this course.');
      },
    });
  }

  return (
    <>
      <div className="min-h-full bg-gradient-to-b from-primary/[0.04] via-bg to-bg">
        <div className="space-y-8 p-4 sm:p-6 lg:p-8 xl:px-10">
          <section className="rounded-lg border border-line bg-bg-elev p-6 shadow-soft sm:p-8">
            <nav className="flex flex-wrap items-center gap-1.5 text-sm text-ink-3">
              <Link href="/instructor/dashboard" className="transition hover:text-primary">
                Instructor hub
              </Link>
              <ChevronRight className="size-3.5" />
              <span className="font-medium text-ink">My courses</span>
            </nav>

            <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                  Marketplace
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                  My courses
                </h1>
                <p className="mt-3 text-base leading-7 text-ink-2">
                  Create, publish, and manage the courses you sell to learners.
                </p>
              </div>
              <Link href="/instructor/courses/new">
                <Button className="rounded-lg bg-primary hover:bg-primary-dark">
                  <Plus className="size-4" />
                  Create course
                </Button>
              </Link>
            </div>
          </section>

          {courses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line-2 bg-bg-elev p-12 text-center shadow-soft">
              <p className="text-lg font-semibold text-ink">No instructor courses yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">
                Create your first course, set a price, and publish it for learners to buy.
              </p>
              <Link href="/instructor/courses/new" className="mt-6 inline-block">
                <Button className="rounded-lg bg-primary hover:bg-primary-dark">
                  Create your first course
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <InstructorCourseCard
                  key={course.id}
                  course={course}
                  onDelete={openDeleteDialog}
                  isDeleting={deleteCourse.isPending && courseToDelete?.id === course.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <DeleteInstructorCourseDialog
        open={Boolean(courseToDelete)}
        course={courseToDelete}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        isDeleting={deleteCourse.isPending}
        error={deleteError}
      />
    </>
  );
}

export default InstructorCoursesPage;
