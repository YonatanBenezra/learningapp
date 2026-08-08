'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Flag, RefreshCw, Shield } from 'lucide-react';
import { useTranslation } from '@/src/i18n';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import type { ContentFlag, ContentType } from './adminApi';
import {
  AdminReportLoadingShell,
  AdminTableSectionSkeleton,
} from './AdminUi';
import { useAdminFlags, useResolveFlag } from './useAdmin';

type FlagStatus = 'open' | 'resolved' | 'dismissed';
type StatusFilter = FlagStatus | 'all';
type TypeFilter = ContentType | 'all';

const TYPE_LABELS: Record<ContentType, string> = {
  course: 'Courses',
  lesson: 'Lessons',
  exercise: 'Exercises',
  quiz: 'Quizzes',
};

function InlineMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[120px] flex-1 px-5 py-4 sm:px-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-3">{label}</p>
      <p className="mt-1.5 font-heading text-2xl font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="min-w-[148px]">
      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className={cn(
          'h-9 w-full rounded-md border border-line bg-bg px-3 text-sm capitalize text-ink',
          'outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15',
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="capitalize">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function flagStatusVariant(status: FlagStatus): 'default' | 'good' | 'warn' | 'bad' {
  if (status === 'open') return 'warn';
  if (status === 'resolved') return 'good';
  return 'default';
}

function FlagRow({
  flag,
  pending,
  onResolve,
  onDismiss,
}: {
  flag: ContentFlag;
  pending: boolean;
  onResolve: () => void;
  onDismiss: () => void;
}) {
  return (
    <tr className="border-b border-line last:border-b-0 hover:bg-bg-soft/80">
      <td className="px-5 py-4 sm:px-6">
        <Badge variant="primary" className="capitalize">
          {flag.contentType}
        </Badge>
      </td>
      <td className="px-5 py-4 font-mono text-xs text-ink-3 sm:px-6">
        {flag.contentId.slice(0, 12)}…
      </td>
      <td className="max-w-md px-5 py-4 sm:px-6">
        <p className="text-sm leading-6 text-ink">{flag.reason}</p>
      </td>
      <td className="px-5 py-4 sm:px-6">
        <Badge variant={flagStatusVariant(flag.status)} className="capitalize">
          {flag.status}
        </Badge>
      </td>
      <td className="px-5 py-4 text-sm tabular-nums text-ink-2 sm:px-6">
        {formatDate(flag.createdAt)}
      </td>
      <td className="px-5 py-4 text-sm tabular-nums text-ink-2 sm:px-6">
        {formatDate(flag.resolvedAt)}
      </td>
      <td className="px-5 py-4 sm:px-6">
        {flag.status === 'open' ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="soft"
              size="sm"
              className="rounded-md"
              disabled={pending}
              onClick={onResolve}
            >
              Resolve
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-md text-ink-2"
              disabled={pending}
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          </div>
        ) : (
          <span className="text-xs text-ink-3">Closed</span>
        )}
      </td>
    </tr>
  );
}

export function AdminFlagsPage() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const flagsQ = useAdminFlags();
  const resolveMut = useResolveFlag();

  const derived = useMemo(() => {
    const flags = flagsQ.data?.flags ?? [];
    const open = flags.filter((flag) => flag.status === 'open').length;
    const resolved = flags.filter((flag) => flag.status === 'resolved').length;
    const dismissed = flags.filter((flag) => flag.status === 'dismissed').length;

    const typeCounts = flags.reduce(
      (counts, flag) => {
        counts[flag.contentType] = (counts[flag.contentType] ?? 0) + 1;
        return counts;
      },
      {} as Record<ContentType, number>,
    );

    const filtered = flags.filter((flag) => {
      if (statusFilter !== 'all' && flag.status !== statusFilter) return false;
      if (typeFilter !== 'all' && flag.contentType !== typeFilter) return false;
      return true;
    });

    const filtersActive = statusFilter !== 'open' || typeFilter !== 'all';

    return {
      open,
      resolved,
      dismissed,
      total: flags.length,
      typeCounts,
      filtered,
      filtersActive,
    };
  }, [flagsQ.data?.flags, statusFilter, typeFilter]);

  const clearFilters = () => {
    setStatusFilter('open');
    setTypeFilter('all');
  };

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: `All statuses (${derived.total})` },
    { value: 'open', label: `Open (${derived.open})` },
    { value: 'resolved', label: `Resolved (${derived.resolved})` },
    { value: 'dismissed', label: `Dismissed (${derived.dismissed})` },
  ];

  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: `All types (${derived.total})` },
    ...(Object.keys(TYPE_LABELS) as ContentType[]).map((type) => ({
      value: type as TypeFilter,
      label: `${TYPE_LABELS[type]} (${derived.typeCounts[type] ?? 0})`,
    })),
  ];

  if (flagsQ.isLoading) {
    return (
      <AdminReportLoadingShell>
        <AdminTableSectionSkeleton className="mt-6" filterCount={2} rows={8} />
      </AdminReportLoadingShell>
    );
  }

  if (flagsQ.isError) {
    return (
      <div className="flex w-full items-center justify-center px-4 py-20">
        <div className="rounded-md border border-line bg-bg-elev px-8 py-10 text-center">
          <p className="text-ink-2">{t('admin.accessDenied')}</p>
          <Button variant="soft" className="mt-4 rounded-md" onClick={() => flagsQ.refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full bg-bg">
      <div className="border-b border-line bg-[var(--sidebar-bg)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Moderation queue
            </p>
            <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {t('admin.flagsTitle')}
            </h1>
            <p className="mt-2 text-sm text-ink-2">
              Review flagged content and close moderation items
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-fit rounded-md bg-bg-elev"
            onClick={() => flagsQ.refetch()}
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col divide-y divide-line rounded-md border border-line bg-bg-elev sm:flex-row sm:divide-x sm:divide-y-0">
          <InlineMetric label="Open" value={String(derived.open)} />
          <InlineMetric label="Resolved" value={String(derived.resolved)} />
          <InlineMetric label="Dismissed" value={String(derived.dismissed)} />
          <InlineMetric label="Total flags" value={String(derived.total)} />
        </div>

        <section className="mt-6 overflow-hidden rounded-md border border-line bg-bg-elev">
          <div className="flex flex-col gap-4 border-b border-line px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Flag className="size-4 text-primary" />
                Flag registry
              </div>
              <p className="mt-1 text-sm text-ink-2">
                {derived.filtered.length} of {derived.total} records shown
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <FilterSelect
                label="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusOptions}
              />
              <FilterSelect
                label="Content type"
                value={typeFilter}
                onChange={setTypeFilter}
                options={typeOptions}
              />
              {derived.filtersActive ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 rounded-md px-3 text-sm text-ink-2"
                  onClick={clearFilters}
                >
                  Reset filters
                </Button>
              ) : null}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-bg-soft text-[11px] uppercase tracking-[0.14em] text-ink-3">
                  <th className="px-5 py-3 font-semibold sm:px-6">Type</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">Content ID</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">Reason</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">Status</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">Flagged</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">Resolved</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {derived.filtered.length ? (
                  derived.filtered.map((flag) => (
                    <FlagRow
                      key={flag.id}
                      flag={flag}
                      pending={resolveMut.isPending}
                      onResolve={() =>
                        resolveMut.mutate(
                          { flagId: flag.id, resolution: 'resolved' },
                          { onSuccess: () => void flagsQ.refetch() },
                        )
                      }
                      onDismiss={() =>
                        resolveMut.mutate(
                          { flagId: flag.id, resolution: 'dismissed' },
                          { onSuccess: () => void flagsQ.refetch() },
                        )
                      }
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <p className="text-sm font-medium text-ink">No flags match these filters</p>
                      <p className="mt-1 text-sm text-ink-3">
                        Try another status or content type, or reset filters.
                      </p>
                      {derived.filtersActive ? (
                        <Button
                          variant="soft"
                          size="sm"
                          className="mt-4 rounded-md"
                          onClick={clearFilters}
                        >
                          Reset filters
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-line bg-bg-soft/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-ink-3">
              {derived.open > 0
                ? `${derived.open} open flag${derived.open === 1 ? '' : 's'} awaiting review`
                : 'No open flags in the queue'}
            </p>
            <Link
              href="/admin/content"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              <Shield className="size-3.5" />
              Content moderation
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminFlagsPage;
