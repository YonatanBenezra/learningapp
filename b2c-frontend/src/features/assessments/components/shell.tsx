'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AppLoader } from '@/src/components/ui/app-loader';
import { Skeleton } from '@/src/components/ui/skeleton';

export function AssessmentShell({ children }: { children: React.ReactNode }) {
  return <div className="w-full px-4 py-6 sm:px-6 lg:px-8">{children}</div>;
}

export function AssessmentLoading() {
  return (
    <AssessmentShell>
      <div className="mx-auto max-w-3xl animate-fade-in">
        <div className="flex flex-col items-center py-10 text-center sm:py-14">
          <AppLoader size="lg" label="Loading assessment" description="Preparing your questions…" />
        </div>

        <div className="mt-4 space-y-4 rounded-2xl border border-line bg-bg-elev p-6 shadow-card">
          <Skeleton className="h-4 w-36" shimmer />
          <Skeleton className="h-8 w-full max-w-md" shimmer />
          <Skeleton className="h-24 w-full" shimmer />
          <Skeleton className="h-24 w-full" shimmer />
        </div>
      </div>
    </AssessmentShell>
  );
}

export function AssessmentError({
  backHref,
  backLabel,
  label,
}: {
  backHref: string;
  backLabel: string;
  label: string;
}) {
  return (
    <AssessmentShell>
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-primary"
      >
        <ArrowLeft className="size-4" /> {backLabel}
      </Link>
      <div className="mt-8 border border-line bg-bg-elev px-6 py-10 text-center">
        <h1 className="text-lg font-semibold text-ink">{label}</h1>
        <p className="mt-2 text-sm text-ink-2">It may have been removed, or the link is wrong.</p>
      </div>
    </AssessmentShell>
  );
}
