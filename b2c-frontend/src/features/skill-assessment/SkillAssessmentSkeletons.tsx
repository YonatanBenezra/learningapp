'use client';

import { Container } from '@/src/components/marketing/Container';
import { Skeleton } from '@/src/components/ui/skeleton';

function AssessmentPageSkeletonShell({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[calc(100vh-88px)] flex-col">{children}</div>;
}

function AssessmentCardSkeleton() {
  return (
    <div className="rounded-lg border border-line bg-bg-elev p-6 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-3/4" />
        </div>
        <Skeleton className="h-7 w-24 rounded-lg" />
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
      <Skeleton className="mt-6 h-9 w-44 rounded-lg" />
    </div>
  );
}

function QuestionCardSkeleton() {
  return (
    <div className="rounded-3xl border border-line/80 bg-bg-elev p-6 shadow-card sm:p-7">
      <div className="flex items-start gap-4">
        <Skeleton className="size-11 shrink-0 rounded-2xl" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6" />
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function AssessmentsListSkeleton() {
  return (
    <AssessmentPageSkeletonShell>
      <div className="pb-16 pt-8 lg:pt-12">
        <Container>
          <div className="overflow-hidden rounded-lg border border-line bg-bg-elev shadow-soft">
            <div className="border-b border-line px-6 py-6 sm:px-8 sm:py-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl space-y-4">
                  <Skeleton className="h-7 w-40 rounded-lg" />
                  <Skeleton className="h-10 w-72" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-14 w-36 rounded-lg" />
                  <Skeleton className="h-14 w-48 rounded-lg" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <AssessmentCardSkeleton key={i} />
            ))}
          </div>
        </Container>
      </div>
    </AssessmentPageSkeletonShell>
  );
}

export function AssessmentTakeSkeleton() {
  return (
    <AssessmentPageSkeletonShell>
      <div className="flex flex-1 flex-col pb-32 pt-8 lg:pt-12">
        <Container className="flex max-w-[1240px] flex-1 flex-col">
          <div className="overflow-hidden rounded-3xl border border-line/80 bg-bg-elev shadow-lift">
            <div className="border-b border-line/70 px-6 py-6 sm:px-8 sm:py-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl space-y-4">
                  <Skeleton className="h-7 w-36 rounded-full" />
                  <Skeleton className="h-10 w-80" />
                  <Skeleton className="h-4 w-full max-w-2xl" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="grid min-w-[220px] grid-cols-3 gap-3 sm:gap-4">
                  <Skeleton className="h-20 rounded-2xl" />
                  <Skeleton className="h-20 rounded-2xl" />
                  <Skeleton className="h-20 rounded-2xl" />
                </div>
              </div>
            </div>
            <div className="px-6 py-5 sm:px-8">
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-28 rounded-full" />
                ))}
              </div>
              <Skeleton className="mt-4 h-2 w-full rounded-full" />
            </div>
          </div>

          <div className="mt-8 grid flex-1 gap-6 xl:grid-cols-2">
            <QuestionCardSkeleton />
            <QuestionCardSkeleton />
          </div>
        </Container>

        <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-line/80 bg-bg-elev/90 backdrop-blur-md">
          <Container className="max-w-[1240px]">
            <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-11 w-32 rounded-xl" />
                <Skeleton className="h-11 w-40 rounded-xl" />
              </div>
            </div>
          </Container>
        </div>
      </div>
    </AssessmentPageSkeletonShell>
  );
}

export function AssessmentResultSkeleton() {
  return (
    <AssessmentPageSkeletonShell>
      <div className="flex flex-1 flex-col pb-16 pt-8 lg:pt-12">
        <Container className="flex max-w-[1240px] flex-1 flex-col">
          <div className="overflow-hidden rounded-3xl border border-line/80 bg-bg-elev shadow-lift">
            <div className="px-6 py-12 text-center sm:px-10 sm:py-14">
              <Skeleton className="mx-auto size-16 rounded-3xl" />
              <Skeleton className="mx-auto mt-5 h-4 w-32" />
              <Skeleton className="mx-auto mt-3 h-12 w-48" />
              <Skeleton className="mx-auto mt-4 h-16 w-28" />
              <div className="mx-auto mt-5 flex max-w-md justify-center gap-3">
                <Skeleton className="h-8 w-28 rounded-full" />
                <Skeleton className="h-8 w-32 rounded-full" />
                <Skeleton className="h-8 w-36 rounded-full" />
              </div>
              <Skeleton className="mx-auto mt-6 h-4 w-full max-w-lg" />
              <Skeleton className="mx-auto mt-2 h-4 w-2/3 max-w-md" />
            </div>
          </div>

          <div className="mt-10 flex flex-1 flex-col">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-8 w-56" />
            <div className="mt-6 grid flex-1 gap-5 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-3xl border border-line/80 bg-bg-elev p-6 shadow-card"
                >
                  <div className="flex gap-4">
                    <Skeleton className="size-11 shrink-0 rounded-2xl" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-4/5" />
                      <Skeleton className="h-16 w-full rounded-2xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </div>
    </AssessmentPageSkeletonShell>
  );
}
