'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useExercise } from '@/src/features/exercises';
import { ExerciseView } from '@/src/features/exercises/components/ExerciseView';
import { Button } from '@/src/components/ui/button';
import { Skeleton } from '@/src/components/ui/skeleton';

function ExercisePageSkeleton() {
  return (
    <div className="min-h-full bg-gradient-to-b from-primary/[0.04] via-bg to-bg">
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="border-b border-line pb-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-3 h-4 w-64" />
        </div>
        <Skeleton className="h-52 w-full rounded-xl" />
        <Skeleton className="h-[420px] w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function ExercisePageClient({
  lessonId,
  exerciseId,
}: {
  lessonId: string;
  exerciseId: string;
}) {
  const { data: exercise, isLoading, isError } = useExercise(exerciseId);

  if (isLoading) {
    return <ExercisePageSkeleton />;
  }

  if (isError || !exercise) {
    return (
      <div className="min-h-full bg-gradient-to-b from-primary/[0.04] via-bg to-bg">
        <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
          <Link
            href={`/lesson/${lessonId}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition hover:text-primary"
          >
            <ArrowLeft className="size-4" /> Back to lesson
          </Link>
          <div className="mt-8 rounded-xl border border-line bg-bg-elev px-6 py-12 text-center shadow-soft">
            <h1 className="text-xl font-bold text-ink">Exercise not found</h1>
            <p className="mt-2 text-sm text-ink-2">
              It may have been removed, or the link is incorrect.
            </p>
            <Link href={`/lesson/${lessonId}`} className="mt-6 inline-block">
              <Button variant="soft">Return to lesson</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <ExerciseView lessonId={lessonId} exercise={exercise} />;
}
