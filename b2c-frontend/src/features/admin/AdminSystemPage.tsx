'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ChevronRight,
  Flag,
  RefreshCw,
  Server,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from '@/src/i18n';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  AdminReportLoadingShell,
  AdminSidebarChartSkeleton,
  AdminTableSectionSkeleton,
} from './AdminUi';
import { cn } from '@/src/lib/utils';
import type { QueueCounts, SystemDashboard } from './adminApi';
import { useAdminSystem } from './useAdmin';

function InlineMetric({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'warn' | 'bad';
}) {
  return (
    <div className="min-w-[120px] flex-1 px-5 py-4 sm:px-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-3">{label}</p>
      <p
        className={cn(
          'mt-1.5 font-heading text-2xl font-semibold tabular-nums',
          tone === 'bad' && 'text-bad',
          tone === 'warn' && 'text-warn',
          tone === 'default' && 'text-ink',
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-ink-3">{hint}</p> : null}
    </div>
  );
}

type HealthTone = 'good' | 'warn' | 'bad';

function healthLabel(tone: HealthTone) {
  if (tone === 'good') return 'Normal';
  if (tone === 'warn') return 'Attention';
  return 'Critical';
}

function healthBadgeVariant(tone: HealthTone): 'good' | 'warn' | 'bad' {
  return tone;
}

function queueUnavailable(queue: QueueCounts) {
  return queue.unavailable === true;
}

function queueTotal(queue: QueueCounts) {
  if (queueUnavailable(queue)) return 0;
  return queue.waiting + queue.active + queue.failed + queue.delayed;
}

function queueHealth(queue: QueueCounts): HealthTone {
  if (queueUnavailable(queue)) return 'bad';
  if (queue.failed > 0) return 'bad';
  if (queue.waiting > 0 || queue.delayed > 0) return 'warn';
  return 'good';
}

function deriveSystemHealth(data: SystemDashboard) {
  const queuesOnline =
    !queueUnavailable(data.queues.courseGeneration) &&
    !queueUnavailable(data.queues.skillAssessmentGeneration);

  const activeJobs =
    (queueUnavailable(data.queues.courseGeneration) ? 0 : data.queues.courseGeneration.active) +
    (queueUnavailable(data.queues.skillAssessmentGeneration)
      ? 0
      : data.queues.skillAssessmentGeneration.active);

  const pendingJobs =
    (queueUnavailable(data.queues.courseGeneration)
      ? 0
      : data.queues.courseGeneration.waiting + data.queues.courseGeneration.delayed) +
    (queueUnavailable(data.queues.skillAssessmentGeneration)
      ? 0
      : data.queues.skillAssessmentGeneration.waiting +
        data.queues.skillAssessmentGeneration.delayed);

  const failedJobs =
    (queueUnavailable(data.queues.courseGeneration) ? 0 : data.queues.courseGeneration.failed) +
    (queueUnavailable(data.queues.skillAssessmentGeneration)
      ? 0
      : data.queues.skillAssessmentGeneration.failed);

  const issueCount =
    data.openFlags +
    data.failedCourses +
    data.failedAssessments +
    failedJobs +
    (queuesOnline ? 0 : 1);

  let overall: HealthTone = 'good';
  if (
    !queuesOnline ||
    data.failedCourses > 0 ||
    data.failedAssessments > 0 ||
    failedJobs > 0
  ) {
    overall = 'bad';
  } else if (data.openFlags > 0 || pendingJobs > 0 || data.generatingCourses > 0) {
    overall = 'warn';
  }

  const alerts = [
    data.openFlags > 0
      ? {
          area: 'Moderation',
          metric: 'Open flags',
          count: data.openFlags,
          tone: 'warn' as const,
          href: '/admin/flags',
          action: 'Review flags',
        }
      : null,
    data.failedMarketplaceCourses > 0
      ? {
          area: 'Marketplace',
          metric: 'Failed courses',
          count: data.failedMarketplaceCourses,
          tone: 'bad' as const,
          href: '/admin/marketplace?status=failed',
          action: 'View failed',
        }
      : null,
    data.failedPersonalCourses > 0
      ? {
          area: 'Personal courses',
          metric: 'Failed courses',
          count: data.failedPersonalCourses,
          tone: 'bad' as const,
          href: '/admin/content',
          action: 'Open content',
        }
      : null,
    data.generatingMarketplaceCourses > 0
      ? {
          area: 'Marketplace',
          metric: 'In progress',
          count: data.generatingMarketplaceCourses,
          tone: 'warn' as const,
          href: '/admin/marketplace?status=generating',
          action: 'View generating',
        }
      : null,
    data.generatingCourses - data.generatingMarketplaceCourses > 0
      ? {
          area: 'Personal courses',
          metric: 'In progress',
          count: data.generatingCourses - data.generatingMarketplaceCourses,
          tone: 'warn' as const,
          href: '/admin/content',
          action: 'Open content',
        }
      : null,
    data.failedAssessments > 0
      ? {
          area: 'Skill assessments',
          metric: 'Failed assessments',
          count: data.failedAssessments,
          tone: 'bad' as const,
          href: '/admin/assessments',
          action: 'Open assessments',
        }
      : null,
    !queueUnavailable(data.queues.courseGeneration) && data.queues.courseGeneration.failed > 0
      ? {
          area: 'Course queue',
          metric: 'Failed jobs',
          count: data.queues.courseGeneration.failed,
          tone: 'bad' as const,
          href: '/admin/system',
          action: 'Inspect queue',
        }
      : null,
    !queueUnavailable(data.queues.skillAssessmentGeneration) &&
    data.queues.skillAssessmentGeneration.failed > 0
      ? {
          area: 'Assessment queue',
          metric: 'Failed jobs',
          count: data.queues.skillAssessmentGeneration.failed,
          tone: 'bad' as const,
          href: '/admin/system',
          action: 'Inspect queue',
        }
      : null,
    !queuesOnline
      ? {
          area: 'Job infrastructure',
          metric: 'Queue backend',
          count: 1,
          tone: 'bad' as const,
          href: '/admin/system',
          action: 'Check Redis',
        }
      : null,
  ].filter(Boolean) as {
    area: string;
    metric: string;
    count: number;
    tone: HealthTone;
    href: string;
    action: string;
  }[];

  return {
    queuesOnline,
    activeJobs,
    pendingJobs,
    failedJobs,
    issueCount,
    overall,
    alerts,
    courseQueueHealth: queueHealth(data.queues.courseGeneration),
    assessmentQueueHealth: queueHealth(data.queues.skillAssessmentGeneration),
    courseQueueTotal: queueTotal(data.queues.courseGeneration),
    assessmentQueueTotal: queueTotal(data.queues.skillAssessmentGeneration),
  };
}

function QueueLedgerTable({
  title,
  subtitle,
  queue,
  health,
}: {
  title: string;
  subtitle: string;
  queue: QueueCounts;
  health: HealthTone;
}) {
  const rows = queueUnavailable(queue)
    ? [{ label: 'Status', value: 'Unavailable (Redis offline)' }]
    : [
        { label: 'Waiting', value: queue.waiting.toLocaleString() },
        { label: 'Active', value: queue.active.toLocaleString() },
        { label: 'Delayed', value: queue.delayed.toLocaleString() },
        { label: 'Failed', value: queue.failed.toLocaleString() },
      ];

  return (
    <section className="overflow-hidden rounded-md border border-line bg-bg-elev">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <div>
          <h2 className="font-heading text-lg font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-ink-2">{subtitle}</p>
        </div>
        <Badge variant={healthBadgeVariant(health)}>{healthLabel(health)}</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-bg-soft text-[11px] uppercase tracking-[0.14em] text-ink-3">
              <th className="px-5 py-3 font-semibold sm:px-6">Metric</th>
              <th className="px-5 py-3 font-semibold sm:px-6">Count</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-line last:border-b-0 hover:bg-bg-soft/80">
                <td className="px-5 py-4 font-medium text-ink sm:px-6">{row.label}</td>
                <td
                  className={cn(
                    'px-5 py-4 tabular-nums sm:px-6',
                    row.label === 'Failed' && !queueUnavailable(queue) && queue.failed > 0
                      ? 'font-semibold text-bad'
                      : 'text-ink-2',
                  )}
                >
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AdminSystemPage() {
  const { t } = useTranslation();
  const dataQ = useAdminSystem();

  const derived = useMemo(() => {
    if (!dataQ.data) return null;
    return deriveSystemHealth(dataQ.data);
  }, [dataQ.data]);

  if (dataQ.isLoading) {
    return (
      <AdminReportLoadingShell>
        <AdminSidebarChartSkeleton className="mt-6" />
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <AdminTableSectionSkeleton filterCount={0} rows={4} />
          <AdminTableSectionSkeleton filterCount={0} rows={4} />
        </div>
        <AdminTableSectionSkeleton className="mt-6" filterCount={0} rows={3} />
      </AdminReportLoadingShell>
    );
  }

  if (dataQ.isError || !dataQ.data || !derived) {
    return (
      <div className="flex w-full items-center justify-center px-4 py-20">
        <div className="rounded-md border border-line bg-bg-elev px-8 py-10 text-center">
          <p className="text-ink-2">{t('admin.accessDenied')}</p>
          <Button variant="soft" className="mt-4 rounded-md" onClick={() => dataQ.refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  const data = dataQ.data;

  return (
    <div className="w-full min-h-full bg-bg">
      <div className="border-b border-line bg-[var(--sidebar-bg)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Operations registry
            </p>
            <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {t('admin.systemTitle')}
            </h1>
            <p className="mt-2 text-sm text-ink-2">
              Platform health, moderation backlog, and background job queue status
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-fit rounded-md bg-bg-elev"
            onClick={() => dataQ.refetch()}
          >
            <RefreshCw className="size-3.5" />
            {t('adminCommon.refresh')}
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col divide-y divide-line rounded-md border border-line bg-bg-elev sm:flex-row sm:divide-x sm:divide-y-0">
          <InlineMetric
            label="Open flags"
            value={String(data.openFlags)}
            hint="Awaiting moderation"
            tone={data.openFlags > 0 ? 'warn' : 'default'}
          />
          <InlineMetric
            label="Failed courses"
            value={String(data.failedCourses)}
            hint="Generation errors"
            tone={data.failedCourses > 0 ? 'bad' : 'default'}
          />
          <InlineMetric
            label="Generating"
            value={String(data.generatingCourses)}
            hint="Currently in progress"
            tone={data.generatingCourses > 0 ? 'warn' : 'default'}
          />
          <InlineMetric
            label="Failed assessments"
            value={String(data.failedAssessments)}
            hint="Skill assessment errors"
            tone={data.failedAssessments > 0 ? 'bad' : 'default'}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-md border border-line bg-bg-elev p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-3">
              System summary
            </p>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-ink-3">Overall status</dt>
                <dd className="mt-1">
                  <Badge variant={healthBadgeVariant(derived.overall)}>
                    {healthLabel(derived.overall)}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-ink-3">Queue backend</dt>
                <dd className="mt-0.5 font-semibold text-ink">
                  {derived.queuesOnline ? 'Online' : 'Offline'}
                </dd>
              </div>
              <div>
                <dt className="text-ink-3">Active jobs</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-ink">
                  {derived.activeJobs.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-ink-3">Pending jobs</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-ink">
                  {derived.pendingJobs.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-ink-3">Failed queue jobs</dt>
                <dd
                  className={cn(
                    'mt-0.5 font-semibold tabular-nums',
                    derived.failedJobs > 0 ? 'text-bad' : 'text-ink',
                  )}
                >
                  {derived.failedJobs.toLocaleString()}
                </dd>
              </div>
              <div className="border-t border-line pt-4">
                <dt className="text-ink-3">Tracked issues</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-primary">
                  {derived.issueCount.toLocaleString()}
                </dd>
              </div>
            </dl>
          </aside>

          <section className="rounded-md border border-line bg-bg-elev p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="font-heading text-lg font-semibold text-ink">Operational alerts</h2>
                <p className="mt-1 text-sm text-ink-2">
                  Items requiring review across moderation and background jobs
                </p>
              </div>
              {derived.alerts.length === 0 ? (
                <div className="inline-flex items-center gap-1.5 text-xs text-good">
                  <ShieldCheck className="size-3.5" />
                  All clear
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-xs text-warn">
                  <AlertTriangle className="size-3.5" />
                  {derived.alerts.length} active
                </div>
              )}
            </div>

            {derived.alerts.length ? (
              <div className="overflow-x-auto rounded-md border border-line">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-bg-soft text-[11px] uppercase tracking-[0.14em] text-ink-3">
                      <th className="px-5 py-3 font-semibold sm:px-6">Area</th>
                      <th className="px-5 py-3 font-semibold sm:px-6">Metric</th>
                      <th className="px-5 py-3 font-semibold sm:px-6">Count</th>
                      <th className="px-5 py-3 font-semibold sm:px-6">{t('adminCommon.colStatus')}</th>
                      <th className="px-5 py-3 font-semibold sm:px-6">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {derived.alerts.map((alert) => (
                      <tr
                        key={`${alert.area}-${alert.metric}`}
                        className="border-b border-line last:border-b-0 hover:bg-bg-soft/80"
                      >
                        <td className="px-5 py-4 font-medium text-ink sm:px-6">{alert.area}</td>
                        <td className="px-5 py-4 text-ink-2 sm:px-6">{alert.metric}</td>
                        <td className="px-5 py-4 tabular-nums text-ink sm:px-6">
                          {alert.count.toLocaleString()}
                        </td>
                        <td className="px-5 py-4 sm:px-6">
                          <Badge variant={healthBadgeVariant(alert.tone)}>
                            {healthLabel(alert.tone)}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 sm:px-6">
                          <Link
                            href={alert.href}
                            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                          >
                            {alert.action}
                            <ChevronRight className="size-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-md border border-good/20 bg-good-soft/40 px-5 py-8 text-sm text-good">
                All monitored systems are within normal operating thresholds.
              </div>
            )}
          </section>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <QueueLedgerTable
            title="Course generation queue"
            subtitle={`${derived.courseQueueTotal.toLocaleString()} tracked jobs`}
            queue={data.queues.courseGeneration}
            health={derived.courseQueueHealth}
          />
          <QueueLedgerTable
            title="Skill assessment queue"
            subtitle={`${derived.assessmentQueueTotal.toLocaleString()} tracked jobs`}
            queue={data.queues.skillAssessmentGeneration}
            health={derived.assessmentQueueHealth}
          />
        </div>

        <section className="mt-6 overflow-hidden rounded-md border border-line bg-bg-elev">
          <div className="border-b border-line px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <Server className="size-4 text-primary" />
              <h2 className="font-heading text-lg font-semibold text-ink">Infrastructure notes</h2>
            </div>
            <p className="mt-1 text-sm text-ink-2">Operational context for background services</p>
          </div>

          <div className="space-y-4 px-5 py-5 sm:px-6">
            <div className="rounded-md border border-line bg-bg-soft/50 px-4 py-4 text-sm leading-6 text-ink-2">
              {data.labsNote}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/flags"
                className="inline-flex items-center gap-2 rounded-md border border-line bg-bg-elev px-4 py-2.5 text-sm font-medium text-ink transition hover:border-ink/20"
              >
                <Flag className="size-4 text-primary" />
                Moderation flags
                <ChevronRight className="size-3.5 text-ink-3" />
              </Link>
              <Link
                href="/admin/marketplace"
                className="inline-flex items-center gap-2 rounded-md border border-line bg-bg-elev px-4 py-2.5 text-sm font-medium text-ink transition hover:border-ink/20"
              >
                <Server className="size-4 text-primary" />
                Marketplace courses
                <ChevronRight className="size-3.5 text-ink-3" />
              </Link>
              <Link
                href="/admin/assessments"
                className="inline-flex items-center gap-2 rounded-md border border-line bg-bg-elev px-4 py-2.5 text-sm font-medium text-ink transition hover:border-ink/20"
              >
                <AlertTriangle className="size-4 text-primary" />
                Skill assessments
                <ChevronRight className="size-3.5 text-ink-3" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminSystemPage;
