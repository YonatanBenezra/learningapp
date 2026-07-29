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
    <div className="rounded-xl border border-line bg-bg p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-11/12" />
        </div>
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="mt-5 space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg border border-line bg-bg-elev/80 px-3.5 py-3.5">
            <Skeleton className="size-7 shrink-0 rounded-lg" />
            <Skeleton className="mt-1 h-5 flex-1" />
          </div>
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
      <div className="bg-bg pb-28 pt-10 lg:pt-12">
        <Container>
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-5 w-full max-w-2xl" />
              </div>
              <div className="grid min-w-[280px] grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line sm:min-w-[320px]">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2 bg-bg-elev px-4 py-3.5 text-center">
                    <Skeleton className="mx-auto h-3 w-16" />
                    <Skeleton className="mx-auto h-7 w-10" />
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card">
              <div className="border-b border-line px-6 py-5 sm:px-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-24 rounded-full" />
                    ))}
                  </div>
                  <div className="min-w-[240px] flex-1 space-y-2 lg:max-w-xs">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-1 w-full rounded-full" />
                  </div>
                </div>
              </div>

              <div className="grid gap-6 p-6 sm:p-8 xl:grid-cols-2">
                <QuestionCardSkeleton />
                <QuestionCardSkeleton />
              </div>
            </div>
          </div>
        </Container>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg-elev/95 backdrop-blur-sm">
          <Container>
            <div className="mx-auto flex max-w-6xl flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <Skeleton className="h-5 w-full max-w-md" />
              <div className="flex gap-2 sm:justify-end">
                <Skeleton className="h-10 w-28 rounded-full" />
                <Skeleton className="h-10 w-32 rounded-full" />
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
      <div className="bg-bg pb-28 pt-10 lg:pt-12">
        <Container>
          <div className="mx-auto max-w-6xl space-y-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-10 w-56" />
                <Skeleton className="h-5 w-full max-w-2xl" />
              </div>
              <div className="grid min-w-[280px] grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line sm:min-w-[320px]">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2 bg-bg-elev px-4 py-3.5 text-center">
                    <Skeleton className="mx-auto h-3 w-12" />
                    <Skeleton className="mx-auto h-7 w-14" />
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card">
              <div className="grid lg:grid-cols-[1fr_280px] lg:divide-x lg:divide-line">
                <div className="space-y-4 px-6 py-8 sm:px-10 sm:py-10">
                  <Skeleton className="h-8 w-40 rounded-full" />
                  <Skeleton className="h-8 w-52" />
                  <Skeleton className="h-4 w-full max-w-xl" />
                  <Skeleton className="mt-4 h-1 w-full max-w-xl rounded-full" />
                </div>
                <div className="flex flex-col items-center border-t border-line px-6 py-10 lg:border-t-0">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="mt-3 h-14 w-24" />
                  <Skeleton className="mt-2 h-6 w-28" />
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card">
              <div className="border-b border-line px-6 py-8 sm:px-10">
                <Skeleton className="h-8 w-72" />
                <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
              </div>
              <div className="grid lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-3 border-b border-line px-6 py-6 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0 sm:px-8 sm:py-8">
                    <Skeleton className="size-8 rounded-lg" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card">
              <div className="border-b border-line px-6 py-5 sm:px-8">
                <Skeleton className="h-7 w-48" />
              </div>
              <div className="grid gap-6 p-6 sm:p-8 xl:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <QuestionCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        </Container>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg-elev/95 backdrop-blur-sm">
          <Container>
            <div className="mx-auto flex max-w-6xl flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <Skeleton className="h-5 w-full max-w-sm" />
              <div className="flex gap-2 sm:justify-end">
                <Skeleton className="h-10 w-36 rounded-full" />
                <Skeleton className="h-10 w-28 rounded-full" />
                <Skeleton className="h-10 w-40 rounded-full" />
              </div>
            </div>
          </Container>
        </div>
      </div>
    </AssessmentPageSkeletonShell>
  );
}
