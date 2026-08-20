'use client';

import { Container } from '@/src/components/marketing/Container';
import { Skeleton } from '@/src/components/ui/skeleton';

function QuestionCardSkeleton() {
  return (
    <div>
      <div className="flex gap-5">
        <Skeleton className="h-12 w-12 shrink-0" shimmer />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-full" shimmer />
          <Skeleton className="h-8 w-4/5" shimmer />
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex min-h-[5.5rem] items-start gap-3 rounded-md border border-line/80 px-4 py-4">
            <Skeleton className="size-9 shrink-0 rounded-full" shimmer />
            <Skeleton className="mt-2 h-4 flex-1" shimmer />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AssessmentsListSkeleton() {
  return (
    <section className="flex min-h-full flex-1 flex-col bg-[var(--marketing-hero)] pt-6 pb-16 lg:pt-8 lg:pb-16">
      <Container>
        <Skeleton className="h-10 w-full max-w-md" shimmer />
        <Skeleton className="mt-3 h-5 w-full max-w-xl" shimmer />

        <div className="mt-8 flex justify-end gap-3">
          <Skeleton className="h-5 w-40" shimmer />
          <Skeleton className="h-11 w-48 rounded-md" shimmer />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-md border border-line/80 bg-bg-elev/90 p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-md" shimmer />
                <div className="flex-1">
                  <Skeleton className="h-4 w-28" shimmer />
                  <Skeleton className="mt-2 h-3 w-16" shimmer />
                </div>
              </div>
              <Skeleton className="mt-5 h-6 w-4/5" shimmer />
              <Skeleton className="mt-6 h-3 w-20" shimmer />
              <Skeleton className="mt-1.5 h-2 w-full rounded-full" shimmer />
              <Skeleton className="mt-4 h-11 w-full rounded-md" shimmer />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function AssessmentTakeSkeleton() {
  return (
    <section className="flex min-h-full flex-1 flex-col bg-[var(--marketing-hero)] pt-6 pb-28 lg:pt-8">
      <Container>
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-40" shimmer />
            <Skeleton className="h-4 w-32" shimmer />
          </div>
          <div className="mt-10 space-y-12">
            <QuestionCardSkeleton />
            <QuestionCardSkeleton />
          </div>
        </div>
      </Container>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-[var(--marketing-hero)]/95">
        <Container>
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-4 w-full max-w-md" shimmer />
            <div className="flex gap-2">
              <Skeleton className="h-11 w-28 rounded-md" shimmer />
              <Skeleton className="h-11 w-32 rounded-md" shimmer />
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}

export function AssessmentResultSkeleton() {
  return (
    <section className="flex min-h-full flex-1 flex-col bg-[var(--marketing-hero)] pt-6 pb-28 lg:pt-8">
      <Container>
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-40" shimmer />
            <Skeleton className="h-4 w-28" shimmer />
          </div>
          <Skeleton className="mt-8 h-4 w-32" shimmer />
          <Skeleton className="mt-4 h-14 w-40" shimmer />
          <Skeleton className="mt-5 h-5 w-full max-w-xl" shimmer />

          <div className="mt-14 space-y-8 border-t border-line/70 pt-10">
            <Skeleton className="h-8 w-64" shimmer />
            <Skeleton className="h-5 w-full max-w-lg" shimmer />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-5">
                <Skeleton className="h-10 w-12 shrink-0" shimmer />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" shimmer />
                  <Skeleton className="h-4 w-full" shimmer />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 space-y-14 border-t border-line/70 pt-10">
            <Skeleton className="h-8 w-52" shimmer />
            <QuestionCardSkeleton />
            <QuestionCardSkeleton />
          </div>
        </div>
      </Container>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-[var(--marketing-hero)]/95">
        <Container>
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-4 w-full max-w-sm" shimmer />
            <div className="flex gap-2">
              <Skeleton className="h-11 w-36 rounded-md" shimmer />
              <Skeleton className="h-11 w-40 rounded-md" shimmer />
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
