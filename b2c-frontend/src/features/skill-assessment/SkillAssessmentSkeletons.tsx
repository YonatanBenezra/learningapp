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
    <div className="rounded-lg border border-line bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_4%,var(--bg-elev))_0%,var(--bg-elev)_100%)] p-5 sm:p-6">
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
      <div className="min-h-[calc(100vh-88px)] bg-gradient-to-b from-primary/[0.07] via-bg to-bg-soft/80 pb-28 pt-8 lg:pt-10">
        <Container className="max-w-[1240px]">
          <header className="overflow-hidden rounded-lg border border-line bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_8%,var(--bg-elev))_0%,var(--bg-elev)_55%)]">
            <div className="border-b border-line px-6 py-6 sm:px-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl space-y-3">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-9 w-72 sm:h-10 sm:w-80" />
                  <Skeleton className="h-5 w-full max-w-2xl" />
                  <Skeleton className="h-5 w-4/5 max-w-xl" />
                </div>
                <div className="grid min-w-[300px] grid-cols-3 divide-x divide-line overflow-hidden rounded-lg border border-line bg-bg-soft/80">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2 px-4 py-3.5 text-center">
                      <Skeleton className="mx-auto h-3 w-16" />
                      <Skeleton className="mx-auto h-7 w-10" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 sm:px-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-[5.5rem] rounded-lg" />
                  ))}
                </div>
                <div className="min-w-[260px] flex-1 space-y-2 lg:max-w-sm">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-lg" />
                </div>
              </div>
            </div>
          </header>

          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            <QuestionCardSkeleton />
            <QuestionCardSkeleton />
          </div>
        </Container>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg-elev/95 backdrop-blur-sm">
          <Container className="max-w-[1240px]">
            <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:py-4">
              <Skeleton className="h-5 w-full max-w-md" />
              <div className="flex gap-2 sm:justify-end">
                <Skeleton className="h-10 w-[120px] rounded-lg" />
                <Skeleton className="h-10 w-[152px] rounded-lg" />
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
