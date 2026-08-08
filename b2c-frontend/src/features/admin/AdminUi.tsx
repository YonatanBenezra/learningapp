'use client';

import type { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from '@/src/i18n';
import { Button } from '@/src/components/ui/button';
import { Skeleton } from '@/src/components/ui/skeleton';
import { cn } from '@/src/lib/utils';

type MetricAccent = 'primary' | 'secondary' | 'good' | 'warn' | 'bad';

const METRIC_ACCENT: Record<MetricAccent, string> = {
  primary: 'border-t-primary bg-primary-soft/30',
  secondary: 'border-t-secondary bg-secondary-soft/40',
  good: 'border-t-good bg-good-soft/40',
  warn: 'border-t-warn bg-warn-soft/40',
  bad: 'border-t-bad bg-bad-soft/40',
};

export function AdminMetricCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = 'primary',
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: MetricAccent;
}) {
  return (
    <article
      className={cn(
        'rounded-lg border border-line border-t-2 bg-bg-elev p-5 shadow-card transition-colors hover:border-line-2',
        METRIC_ACCENT[accent],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">{label}</p>
          <p className="mt-3 font-heading text-3xl font-semibold tracking-tight text-ink">{value}</p>
          {hint ? <p className="mt-2 text-sm text-ink-2">{hint}</p> : null}
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-line bg-bg-soft text-primary">
          <Icon className="size-5" />
        </span>
      </div>
    </article>
  );
}

export function AdminPanel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-lg border border-line bg-bg-elev p-5 shadow-card sm:p-6',
        className,
      )}
    >
      <div className="border-b border-line pb-4">
        <h3 className="font-heading text-lg font-semibold text-ink">{title}</h3>
        {description ? <p className="mt-1 text-sm text-ink-2">{description}</p> : null}
      </div>
      <div className="pt-5">{children}</div>
    </section>
  );
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  updatedAt,
  onRefresh,
}: {
  eyebrow: string;
  title: string;
  description: string;
  updatedAt?: string;
  onRefresh?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-2 sm:text-base">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {updatedAt ? (
          <p className="text-sm text-ink-3">Updated {new Date(updatedAt).toLocaleString()}</p>
        ) : null}
        {onRefresh ? (
          <Button variant="soft" size="sm" className="rounded-lg" onClick={onRefresh}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function AdminFullPage({ children }: { children: ReactNode }) {
  return <div className="w-full bg-bg-soft/40">{children}</div>;
}

export function AdminFullPageBody({ children }: { children: ReactNode }) {
  return <div className="w-full space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>;
}

export function AdminStatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-line bg-bg-elev p-5 shadow-soft">
      <div className="flex items-center gap-2 text-ink-2">
        <Icon className="size-4 text-primary" />
        <p className="text-xs font-semibold uppercase tracking-[0.12em]">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-bold text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-3">{hint}</p> : null}
    </div>
  );
}

export function AdminPageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <h2 className="text-2xl font-bold text-ink">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-ink-2">{subtitle}</p> : null}
      {children}
    </div>
  );
}

function SkeletonLine({ className }: { className?: string }) {
  return <Skeleton className={cn('h-3 rounded-sm', className)} />;
}

export function AdminReportHeaderSkeleton() {
  return (
    <div className="border-b border-line bg-[var(--sidebar-bg)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <SkeletonLine className="w-28" />
          <Skeleton className="h-8 w-56 rounded-md" />
          <SkeletonLine className="w-full max-w-md" />
        </div>
        <Skeleton className="h-9 w-24 shrink-0 rounded-md" />
      </div>
    </div>
  );
}

export function AdminMetricStripSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col divide-y divide-line rounded-md border border-line bg-bg-elev sm:flex-row sm:divide-x sm:divide-y-0">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="min-w-[120px] flex-1 px-5 py-4 sm:px-6">
          <SkeletonLine className="w-24" />
          <Skeleton className="mt-3 h-8 w-20 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function AdminFilterBarSkeleton({ filters = 2 }: { filters?: number }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      {Array.from({ length: filters }).map((_, index) => (
        <div key={index} className="min-w-[148px]">
          <SkeletonLine className="mb-1.5 w-12" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function AdminTableSectionSkeleton({
  rows = 8,
  className,
  filterCount = 2,
}: {
  rows?: number;
  className?: string;
  filterCount?: number;
}) {
  return (
    <section className={cn('overflow-hidden rounded-md border border-line bg-bg-elev', className)}>
      <div className="flex flex-col gap-4 border-b border-line px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36 rounded-md" />
          <SkeletonLine className="w-52" />
        </div>
        {filterCount > 0 ? <AdminFilterBarSkeleton filters={filterCount} /> : null}
      </div>
      <div className="divide-y divide-line">
        <div className="flex gap-4 bg-bg-soft px-5 py-3 sm:px-6">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonLine key={index} className="flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="flex items-center gap-4 px-5 py-4 sm:px-6">
            <Skeleton className="h-4 flex-[2] rounded-md" />
            <SkeletonLine className="flex-1" />
            <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
            <SkeletonLine className="hidden w-20 sm:block" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 border-t border-line bg-bg-soft/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <SkeletonLine className="w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </div>
    </section>
  );
}

export function AdminSidebarPanelSkeleton({ className }: { className?: string }) {
  return (
    <aside className={cn('rounded-md border border-line bg-bg-elev p-5', className)}>
      <SkeletonLine className="w-32" />
      <Skeleton className="mt-4 h-2 w-full rounded-full" />
      <div className="mt-4 space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex justify-between gap-3">
            <SkeletonLine className="w-24" />
            <SkeletonLine className="w-12" />
          </div>
        ))}
      </div>
    </aside>
  );
}

export function AdminChartPanelSkeleton({ className }: { className?: string }) {
  return (
    <section className={cn('rounded-md border border-line bg-bg-elev p-5 sm:p-6', className)}>
      <Skeleton className="h-4 w-40 rounded-md" />
      <SkeletonLine className="mt-2 w-56" />
      <Skeleton className="mt-5 h-64 w-full rounded-md bg-bg-soft" />
    </section>
  );
}

export function AdminSidebarChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]', className)}>
      <AdminSidebarPanelSkeleton />
      <AdminChartPanelSkeleton />
    </div>
  );
}

export function AdminFormSidebarSkeleton() {
  return (
    <aside className="rounded-md border border-line bg-bg-elev p-5">
      <Skeleton className="h-5 w-36 rounded-md" />
      <SkeletonLine className="mt-2 w-full max-w-xs" />
      <div className="mt-5 space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index}>
            <SkeletonLine className="mb-1.5 w-16" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        ))}
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </aside>
  );
}

export function AdminFormTableSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]', className)}>
      <AdminFormSidebarSkeleton />
      <AdminTableSectionSkeleton rows={6} filterCount={0} />
    </div>
  );
}

export function AdminCardGridSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-md border border-line bg-[var(--sidebar-bg)]"
        >
          <div className="space-y-3 p-5">
            <Skeleton className="h-5 w-4/5 rounded-md" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
            <SkeletonLine className="w-32" />
            <div className="flex items-center gap-2.5 border-t border-line/80 pt-4">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonLine className="w-28" />
                <SkeletonLine className="w-36" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 border-t border-line/80 bg-bg-soft/50 px-3 py-3">
            {Array.from({ length: 3 }).map((_, cell) => (
              <div key={cell} className="space-y-2 px-1">
                <SkeletonLine className="w-10" />
                <SkeletonLine className="w-12" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminContentLayoutSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]', className)}>
      <AdminTableSectionSkeleton rows={6} filterCount={1} />
      <aside className="rounded-md border border-line bg-bg-elev p-5 sm:p-6">
        <Skeleton className="h-5 w-28 rounded-md" />
        <SkeletonLine className="mt-2 w-40" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      </aside>
    </div>
  );
}

export function AdminMetricsDashboardSkeleton() {
  return (
    <div className="w-full bg-bg-soft/40">
      <div className="w-full space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Skeleton className="h-14 w-full max-w-xl rounded-md" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="rounded-lg border border-line border-t-2 border-t-primary/30 bg-bg-elev p-5"
            >
              <SkeletonLine className="w-24" />
              <Skeleton className="mt-3 h-9 w-20 rounded-md" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-12">
          <AdminChartPanelSkeleton className="xl:col-span-7" />
          <section className="rounded-md border border-line bg-bg-elev p-5 sm:p-6 xl:col-span-5">
            <Skeleton className="h-4 w-36 rounded-md" />
            <SkeletonLine className="mt-2 w-48" />
            <Skeleton className="mt-5 h-52 w-full rounded-md bg-bg-soft" />
          </section>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <AdminChartPanelSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminReportLoadingShell({
  children,
  metricCount = 4,
}: {
  children: ReactNode;
  metricCount?: number;
}) {
  return (
    <div className="w-full min-h-full bg-bg">
      <AdminReportHeaderSkeleton />
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <AdminMetricStripSkeleton count={metricCount} />
        {children}
      </div>
    </div>
  );
}

export function AdminQueryState({
  isLoading,
  isError,
  onRetry,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="w-full min-h-full bg-bg">
        <AdminReportHeaderSkeleton />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <AdminMetricStripSkeleton />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        <div className="rounded-2xl border border-line bg-bg-elev p-10 text-center">
          <p className="text-ink-2">{t('admin.accessDenied')}</p>
          <Button variant="soft" className="mt-4" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  return children;
}

export function pct(value: number | null) {
  if (value === null) return '—';
  return `${Math.round(value * 100)}%`;
}

export function formatUsd(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function KeyValueList({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string | number }[];
}) {
  return (
    <section className="rounded-2xl border border-line bg-bg-elev p-5 shadow-soft">
      <h3 className="font-bold text-ink">{title}</h3>
      <dl className="mt-4 space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <dt className="text-ink-2">{row.label}</dt>
            <dd className="font-semibold text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
