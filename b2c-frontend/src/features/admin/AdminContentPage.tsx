'use client';

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flag,
  RefreshCw,
  RotateCcw,
  Shield,
} from 'lucide-react';
import { useTranslation } from '@/src/i18n';
import { ApiError } from '@/src/infrastructure/apiClient';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Skeleton } from '@/src/components/ui/skeleton';
import {
  AdminContentLayoutSkeleton,
  AdminReportLoadingShell,
} from './AdminUi';
import { cn } from '@/src/lib/utils';
import type { ContentFlag, ContentType } from './adminApi';
import {
  useAdminContent,
  useAdminFlags,
  useFlagContent,
  useRegenerateContent,
  useResolveFlag,
} from './useAdmin';

const CONTENT_TYPES: ContentType[] = ['course', 'lesson', 'exercise', 'quiz'];

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
    <div className="min-w-[160px]">
      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className={cn(
          'h-9 w-full rounded-md border border-line bg-bg px-3 text-sm text-ink',
          'outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15',
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function contentTitle(item: Record<string, unknown>) {
  return (
    (item.title as string | undefined) ??
    (item.question as string | undefined) ??
    String(item._id ?? item.id ?? 'Untitled')
  );
}

function contentId(item: Record<string, unknown>) {
  return String(item._id ?? item.id ?? '');
}

function contentStatus(item: Record<string, unknown>) {
  return typeof item.status === 'string' ? item.status : null;
}

function statusBadgeVariant(status: string): 'default' | 'good' | 'warn' | 'bad' {
  if (status === 'ready' || status === 'completed' || status === 'published') return 'good';
  if (status === 'generating') return 'warn';
  if (status === 'failed') return 'bad';
  return 'default';
}

function mutationMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Action failed.';
}

function formatFlagDate(value?: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function FlagQueueItem({
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
    <div className="rounded-lg border border-line bg-bg-soft/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="warn" className="capitalize">
          {flag.contentType}
        </Badge>
        <span className="font-mono text-[11px] text-ink-3">{flag.contentId.slice(0, 12)}…</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-ink">{flag.reason}</p>
      <p className="mt-1 text-xs text-ink-3">Flagged {formatFlagDate(flag.createdAt)}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="soft" className="rounded-md" disabled={pending} onClick={onResolve}>
          Resolve
        </Button>
        <Button size="sm" variant="ghost" className="rounded-md" disabled={pending} onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}

export function AdminContentPage() {
  const { t } = useTranslation();
  const [type, setType] = useState<ContentType>('course');
  const [page, setPage] = useState(1);
  const [flagReason, setFlagReason] = useState('');
  const [activeFlagId, setActiveFlagId] = useState<string | null>(null);

  const contentQ = useAdminContent(type, page);
  const flagsQ = useAdminFlags('open');
  const flagMut = useFlagContent();
  const regenMut = useRegenerateContent();
  const resolveMut = useResolveFlag();

  const derived = useMemo(() => {
    const total = contentQ.data?.total ?? 0;
    const limit = contentQ.data?.limit ?? 20;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const rangeStart = total ? (page - 1) * limit + 1 : 0;
    const rangeEnd = contentQ.data ? Math.min(page * limit, total) : 0;

    return {
      total,
      totalPages,
      rangeStart,
      rangeEnd,
      openFlags: flagsQ.data?.flags.length ?? 0,
      pageCount: contentQ.data?.items.length ?? 0,
    };
  }, [contentQ.data, flagsQ.data?.flags.length, page]);

  function refreshAll() {
    void contentQ.refetch();
    void flagsQ.refetch();
  }

  if (contentQ.isLoading && !contentQ.data) {
    return (
      <AdminReportLoadingShell>
        <AdminContentLayoutSkeleton className="mt-6" />
      </AdminReportLoadingShell>
    );
  }

  if (contentQ.isError) {
    return (
      <div className="flex w-full items-center justify-center px-4 py-20">
        <div className="rounded-md border border-line bg-bg-elev px-8 py-10 text-center">
          <p className="text-ink-2">{t('admin.accessDenied')}</p>
          <Button variant="soft" className="mt-4 rounded-md" onClick={() => contentQ.refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  const typeOptions = CONTENT_TYPES.map((item) => ({
    value: item,
    label: TYPE_LABELS[item],
  }));

  return (
    <div className="w-full min-h-full bg-bg">
      <div className="border-b border-line bg-[var(--sidebar-bg)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Content moderation
            </p>
            <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {t('admin.contentTitle')}
            </h1>
            <p className="mt-2 text-sm text-ink-2">
              Review platform content, flag issues, and trigger AI regeneration
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-fit rounded-md bg-bg-elev"
            onClick={refreshAll}
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col divide-y divide-line rounded-md border border-line bg-bg-elev sm:flex-row sm:divide-x sm:divide-y-0">
          <InlineMetric label={`Total ${TYPE_LABELS[type].toLowerCase()}`} value={derived.total.toLocaleString()} />
          <InlineMetric label="Open flags" value={String(derived.openFlags)} />
          <InlineMetric label="This page" value={String(derived.pageCount)} />
          <InlineMetric
            label="Showing"
            value={derived.total ? `${derived.rangeStart}–${derived.rangeEnd}` : '0'}
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="overflow-hidden rounded-md border border-line bg-bg-elev">
            <div className="flex flex-col gap-4 border-b border-line bg-bg-soft/30 px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Shield className="size-4 text-primary" />
                  Content registry
                </div>
                <p className="mt-1 text-sm text-ink-2">
                  Browse and moderate {TYPE_LABELS[type].toLowerCase()} across the platform
                </p>
              </div>
              <FilterSelect
                label="Content type"
                value={type}
                onChange={(value) => {
                  setType(value);
                  setPage(1);
                  setActiveFlagId(null);
                }}
                options={typeOptions}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-bg-soft text-[11px] uppercase tracking-[0.14em] text-ink-3">
                    <th className="px-5 py-3 font-semibold sm:px-6">Title</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">Content ID</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">Status</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contentQ.data?.items.length ? (
                    contentQ.data.items.map((item) => {
                      const id = contentId(item);
                      const status = contentStatus(item);
                      const isFlagging = activeFlagId === id;

                      return (
                        <Fragment key={id}>
                          <tr className="border-b border-line last:border-b-0 hover:bg-bg-soft/80">
                            <td className="px-5 py-4 sm:px-6">
                              <p className="max-w-md font-medium text-ink">{contentTitle(item)}</p>
                              <p className="mt-0.5 text-xs capitalize text-ink-3">{type}</p>
                            </td>
                            <td className="px-5 py-4 font-mono text-xs text-ink-2 sm:px-6">
                              {id.slice(0, 10)}…
                            </td>
                            <td className="px-5 py-4 sm:px-6">
                              {status ? (
                                <Badge variant={statusBadgeVariant(status)} className="capitalize">
                                  {status}
                                </Badge>
                              ) : (
                                <span className="text-ink-3">—</span>
                              )}
                            </td>
                            <td className="px-5 py-4 sm:px-6">
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-md bg-bg-elev"
                                  disabled={regenMut.isPending || type === 'lesson'}
                                  onClick={() => regenMut.mutate({ type, id })}
                                >
                                  <RotateCcw className="size-3.5" />
                                  Regenerate
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-md bg-bg-elev"
                                  onClick={() => {
                                    setActiveFlagId(isFlagging ? null : id);
                                    setFlagReason('');
                                  }}
                                >
                                  <Flag className="size-3.5" />
                                  Flag
                                </Button>
                              </div>
                              {regenMut.isError && regenMut.variables?.id === id ? (
                                <p className="mt-2 text-xs text-bad">{mutationMessage(regenMut.error)}</p>
                              ) : null}
                            </td>
                          </tr>
                          {isFlagging ? (
                            <tr className="border-b border-line bg-warn-soft/20">
                              <td colSpan={4} className="px-5 py-4 sm:px-6">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">
                                  Flag content
                                </p>
                                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                                  <Input
                                    value={flagReason}
                                    onChange={(e) => setFlagReason(e.target.value)}
                                    placeholder="Reason for flagging…"
                                    className="rounded-md border-line bg-bg-elev sm:max-w-xl"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="rounded-md"
                                      disabled={!flagReason.trim() || flagMut.isPending}
                                      onClick={() =>
                                        flagMut.mutate(
                                          { type, id, reason: flagReason.trim() },
                                          {
                                            onSuccess: () => {
                                              setActiveFlagId(null);
                                              setFlagReason('');
                                              void flagsQ.refetch();
                                            },
                                          },
                                        )
                                      }
                                    >
                                      Submit flag
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="rounded-md"
                                      onClick={() => setActiveFlagId(null)}
                                    >
                                      {t('common.cancel')}
                                    </Button>
                                  </div>
                                </div>
                                {flagMut.isError ? (
                                  <p className="mt-2 text-xs text-bad">{mutationMessage(flagMut.error)}</p>
                                ) : null}
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center text-ink-3">
                        No {TYPE_LABELS[type].toLowerCase()} found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-line bg-bg-soft/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-sm text-ink-3">
                Page {page} of {derived.totalPages} · {derived.total.toLocaleString()} items
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-md bg-bg-elev"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-md bg-bg-elev"
                  disabled={page >= derived.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </section>

          <aside className="rounded-md border border-line bg-bg-elev">
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-warn" />
                <h2 className="font-heading text-lg font-semibold text-ink">Open flags</h2>
              </div>
              <p className="mt-1 text-sm text-ink-2">Moderation queue requiring review</p>
            </div>

            <div className="space-y-3 p-5 sm:p-6">
              {flagsQ.isLoading ? (
                <>
                  <Skeleton className="h-28 w-full rounded-lg" />
                  <Skeleton className="h-28 w-full rounded-lg" />
                </>
              ) : flagsQ.data?.flags.length ? (
                flagsQ.data.flags.map((flag) => (
                  <FlagQueueItem
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
                <div className="rounded-lg border border-dashed border-line px-4 py-10 text-center">
                  <p className="text-sm font-medium text-ink">No open flags</p>
                  <p className="mt-1 text-sm text-ink-3">All moderation items are cleared.</p>
                </div>
              )}
            </div>

            <div className="border-t border-line px-5 py-4 sm:px-6">
              <Link
                href="/admin/flags"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                View full flags queue
                <ChevronRight className="size-3.5" />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default AdminContentPage;
