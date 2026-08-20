'use client';

import { useMemo, useState } from 'react';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Send,
} from 'lucide-react';
import { useTranslation } from '@/src/i18n';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import {
  AdminFormTableSkeleton,
  AdminReportLoadingShell,
} from './AdminUi';
import { cn } from '@/src/lib/utils';
import { useAdminNotifications, useBroadcastNotification } from './useAdmin';

function InlineMetric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-[120px] flex-1 px-5 py-4 sm:px-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-3">{label}</p>
      <p className="mt-1.5 font-heading text-2xl font-semibold tabular-nums text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-3">{hint}</p> : null}
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatPercent(value: number, total: number) {
  if (total <= 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

function statusBadgeVariant(status: string): 'default' | 'good' | 'warn' | 'bad' {
  if (status === 'sent') return 'good';
  if (status === 'failed') return 'bad';
  if (status === 'pending') return 'warn';
  return 'default';
}

export function AdminNotificationsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const notificationsQ = useAdminNotifications(page);
  const broadcastMut = useBroadcastNotification();

  const derived = useMemo(() => {
    if (!notificationsQ.data) return null;

    const sentTotal = notificationsQ.data.byType.reduce((sum, row) => sum + row.sent, 0);
    const failedTotal = notificationsQ.data.byType.reduce((sum, row) => sum + row.failed, 0);
    const totalPages = Math.max(1, Math.ceil(notificationsQ.data.total / notificationsQ.data.limit));
    const rangeStart = notificationsQ.data.total
      ? (notificationsQ.data.page - 1) * notificationsQ.data.limit + 1
      : 0;
    const rangeEnd = Math.min(
      notificationsQ.data.page * notificationsQ.data.limit,
      notificationsQ.data.total,
    );

    return {
      sentTotal,
      failedTotal,
      totalPages,
      rangeStart,
      rangeEnd,
      deliveryRate: formatPercent(sentTotal, notificationsQ.data.total),
      failureRate: formatPercent(failedTotal, notificationsQ.data.total),
    };
  }, [notificationsQ.data]);

  if (notificationsQ.isLoading) {
    return (
      <AdminReportLoadingShell>
        <AdminFormTableSkeleton className="mt-6" />
      </AdminReportLoadingShell>
    );
  }

  if (notificationsQ.isError || !notificationsQ.data || !derived) {
    return (
      <div className="flex w-full items-center justify-center px-4 py-20">
        <div className="rounded-md border border-line bg-bg-elev px-8 py-10 text-center">
          <p className="text-ink-2">{t('admin.accessDenied')}</p>
          <Button variant="soft" className="mt-4 rounded-md" onClick={() => notificationsQ.refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  const data = notificationsQ.data;

  return (
    <div className="w-full min-h-full bg-bg">
      <div className="border-b border-line bg-[var(--sidebar-bg)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Notifications
            </p>
            <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {t('admin.notificationsTitle')}
            </h1>
            <p className="mt-2 text-sm text-ink-2">
              Send platform notifications, review delivery records, and monitor performance
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-fit rounded-md bg-bg-elev"
            onClick={() => notificationsQ.refetch()}
          >
            <RefreshCw className="size-3.5" />
            {t('adminCommon.refresh')}
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col divide-y divide-line rounded-md border border-line bg-bg-elev sm:flex-row sm:divide-x sm:divide-y-0">
          <InlineMetric label="Total records" value={data.total.toLocaleString()} />
          <InlineMetric
            label="Delivered"
            value={derived.sentTotal.toLocaleString()}
            hint={`${derived.deliveryRate} success rate`}
          />
          <InlineMetric
            label="Failed"
            value={derived.failedTotal.toLocaleString()}
            hint={`${derived.failureRate} failure rate`}
          />
          <InlineMetric label="Notification types" value={String(data.byType.length)} />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="rounded-md border border-line bg-bg-elev p-5">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-primary" />
                <h2 className="font-heading text-lg font-semibold text-ink">Send notification</h2>
              </div>
              <p className="mt-1 text-sm text-ink-2">
                Deliver a notification to all active user accounts.
              </p>

              <form
                className="mt-5 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  broadcastMut.mutate(
                    { title: title.trim(), body: body.trim() },
                    {
                      onSuccess: () => {
                        setTitle('');
                        setBody('');
                        setPage(1);
                      },
                    },
                  );
                }}
              >
                <div>
                  <Label htmlFor="notification-title">Subject line</Label>
                  <Input
                    id="notification-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Scheduled maintenance notice"
                    className="mt-1.5 rounded-md border-line bg-bg-soft"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="notification-body">Message body</Label>
                  <textarea
                    id="notification-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={5}
                    placeholder="Enter the official announcement text…"
                    required
                    className={cn(
                      'mt-1.5 w-full rounded-md border border-line bg-bg-soft px-3 py-2 text-sm text-ink',
                      'outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15',
                    )}
                  />
                </div>
                <Button type="submit" className="w-full rounded-md" disabled={broadcastMut.isPending}>
                  <Send className="size-3.5" />
                  Send notification
                </Button>
                {broadcastMut.data ? (
                  <p className="rounded-md border border-good/20 bg-good-soft/30 px-3 py-2 text-sm text-good">
                    Notification sent to {broadcastMut.data.recipients.toLocaleString()} recipients.
                  </p>
                ) : null}
              </form>
            </section>

            <section className="overflow-hidden rounded-md border border-line bg-bg-elev">
              <div className="border-b border-line px-5 py-4">
                <div className="flex items-center gap-2">
                  <Bell className="size-4 text-primary" />
                  <h2 className="font-heading text-lg font-semibold text-ink">Delivery summary</h2>
                </div>
                <p className="mt-1 text-sm text-ink-2">Performance by notification category</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-bg-soft text-[11px] uppercase tracking-[0.14em] text-ink-3">
                      <th className="px-5 py-3 font-semibold">Type</th>
                      <th className="px-5 py-3 font-semibold">Sent</th>
                      <th className="px-5 py-3 font-semibold">Failed</th>
                      <th className="px-5 py-3 font-semibold">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byType.length ? (
                      data.byType.map((row) => (
                        <tr key={row.type} className="border-b border-line last:border-b-0">
                          <td className="px-5 py-3 font-medium text-ink">{row.type}</td>
                          <td className="px-5 py-3 tabular-nums text-ink-2">
                            {row.sent}/{row.total}
                          </td>
                          <td className="px-5 py-3 tabular-nums text-ink-2">{row.failed}</td>
                          <td className="px-5 py-3 tabular-nums text-ink-2">
                            {formatPercent(row.sent, row.total)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-ink-3">
                          No delivery statistics available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </aside>

          <section className="overflow-hidden rounded-md border border-line bg-bg-elev">
            <div className="border-b border-line bg-bg-soft/30 px-5 py-4 sm:px-6">
              <h2 className="font-heading text-lg font-semibold text-ink">Delivery register</h2>
              <p className="mt-1 text-sm text-ink-2">
                Records {derived.rangeStart}–{derived.rangeEnd} of {data.total.toLocaleString()}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-bg-soft text-[11px] uppercase tracking-[0.14em] text-ink-3">
                    <th className="px-5 py-3 font-semibold sm:px-6">Type</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">Subject</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">Channel</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">{t('adminCommon.colStatus')}</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.length ? (
                    data.items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-line last:border-b-0 hover:bg-bg-soft/80"
                      >
                        <td className="px-5 py-4 sm:px-6">
                          <Badge variant="default">{item.type}</Badge>
                        </td>
                        <td className="max-w-md px-5 py-4 sm:px-6">
                          <p className="font-medium text-ink">
                            {item.payload?.subject ?? item.type}
                          </p>
                          {item.payload?.body ? (
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-3">
                              {item.payload.body}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-5 py-4 capitalize text-ink-2 sm:px-6">{item.channel}</td>
                        <td className="px-5 py-4 sm:px-6">
                          <Badge variant={statusBadgeVariant(item.status)} className="capitalize">
                            {item.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-sm tabular-nums text-ink-2 sm:px-6">
                          {formatDate(item.sentAt ?? item.createdAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-ink-3">
                        No notification records on file.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-line bg-bg-soft/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-sm text-ink-3">
                Page {page} of {derived.totalPages}
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
        </div>
      </div>
    </div>
  );
}

export default AdminNotificationsPage;
