'use client';

import { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  AdminReportLoadingShell,
  AdminSidebarChartSkeleton,
  AdminTableSectionSkeleton,
} from './AdminUi';
import { useTranslation } from '@/src/i18n';
import { cn } from '@/src/lib/utils';
import type { AssessmentDashboard } from './adminApi';
import { useAdminAssessmentsDashboard } from './useAdmin';

const STATUS_ORDER = ['ready', 'generating', 'failed'] as const;
const LEVEL_ORDER = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;

const STATUS_COLORS: Record<(typeof STATUS_ORDER)[number], string> = {
  ready: '#007F8E',
  generating: '#F97316',
  failed: '#EF4444',
};

const LEVEL_COLORS: Record<(typeof LEVEL_ORDER)[number], string> = {
  Beginner: '#94A3B8',
  Intermediate: '#007F8E',
  Advanced: '#6366F1',
  Expert: '#F97316',
};

const CHART_TOOLTIP = {
  contentStyle: {
    borderRadius: 6,
    border: '1px solid var(--line)',
    background: 'var(--bg-elev)',
    color: 'var(--ink)',
    fontSize: 12,
  },
  labelStyle: { color: 'var(--ink-2)' },
  itemStyle: { color: 'var(--ink)' },
};

const BAR_CURSOR = { fill: 'var(--bg-soft)', opacity: 0.45 };

function InlineMetric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-[140px] flex-1 px-5 py-4 sm:px-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-3">{label}</p>
      <p className="mt-1.5 font-heading text-2xl font-semibold tabular-nums text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-3">{hint}</p> : null}
    </div>
  );
}

function formatPercent(value: number, total: number) {
  if (total <= 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, ' ');
}

function statusBadgeVariant(status: string): 'default' | 'good' | 'warn' | 'bad' {
  if (status === 'ready') return 'good';
  if (status === 'generating') return 'warn';
  if (status === 'failed') return 'bad';
  return 'default';
}

function truncateTopic(topic: string, max = 18) {
  if (topic.length <= max) return topic;
  return `${topic.slice(0, max - 1)}…`;
}

function buildStatusRows(data: AssessmentDashboard) {
  const known = new Set<string>();
  const rows: { status: string; count: number }[] = STATUS_ORDER.map((status) => {
    known.add(status);
    return { status, count: data.byStatus[status] ?? 0 };
  });

  for (const [status, count] of Object.entries(data.byStatus)) {
    if (!known.has(status)) rows.push({ status, count });
  }

  return rows.sort((a, b) => b.count - a.count);
}

function buildLevelRows(data: AssessmentDashboard) {
  const map = new Map(data.byLevel.map((row) => [row.level, row.count]));
  const rows: { level: string; count: number }[] = LEVEL_ORDER.map((level) => ({
    level,
    count: map.get(level) ?? 0,
  }));

  for (const row of data.byLevel) {
    if (!LEVEL_ORDER.includes(row.level as (typeof LEVEL_ORDER)[number])) {
      rows.push({ level: row.level, count: row.count });
    }
  }

  return rows;
}

function PipelineBar({ data }: { data: AssessmentDashboard }) {
  const total = data.totalAssessments;
  if (total <= 0) {
    return <div className="mt-4 h-2 rounded-full bg-bg-soft" aria-hidden />;
  }

  const segments = STATUS_ORDER.map((status) => ({
    status,
    width: ((data.byStatus[status] ?? 0) / total) * 100,
  }));

  return (
    <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-bg-soft" aria-hidden>
      {segments.map((segment) =>
        segment.width > 0 ? (
          <div
            key={segment.status}
            className="h-full"
            style={{
              width: `${segment.width}%`,
              backgroundColor: STATUS_COLORS[segment.status],
            }}
          />
        ) : null,
      )}
    </div>
  );
}

function LevelMiniBar({ count, max }: { count: number; max: number }) {
  const width = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-bg-soft">
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-ink-3">{formatPercent(count, max)}</span>
    </div>
  );
}

export function AdminAssessmentsPage() {
  const { t } = useTranslation();
  const dataQ = useAdminAssessmentsDashboard();

  const derived = useMemo(() => {
    if (!dataQ.data) return null;

    const ready = dataQ.data.byStatus.ready ?? 0;
    const generating = dataQ.data.byStatus.generating ?? 0;
    const failed = dataQ.data.byStatus.failed ?? 0;
    const levelRows = buildLevelRows(dataQ.data);
    const topicChart = dataQ.data.byTopic.map((row) => ({
      topic: row.topic,
      label: truncateTopic(row.topic),
      count: row.count,
    }));

    return {
      ready,
      generating,
      failed,
      statusRows: buildStatusRows(dataQ.data),
      levelRows,
      topicChart,
      readyRate: formatPercent(ready, dataQ.data.totalAssessments),
      failureRate: formatPercent(failed, dataQ.data.totalAssessments),
      submissionsPerAssessment:
        dataQ.data.totalAssessments > 0
          ? (dataQ.data.completedSubmissions / dataQ.data.totalAssessments).toFixed(2)
          : '0',
    };
  }, [dataQ.data]);

  if (dataQ.isLoading) {
    return (
      <AdminReportLoadingShell>
        <AdminSidebarChartSkeleton className="mt-6" />
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <AdminTableSectionSkeleton filterCount={0} rows={4} />
          <AdminTableSectionSkeleton filterCount={0} rows={4} />
        </div>
        <AdminTableSectionSkeleton className="mt-6" filterCount={0} rows={5} />
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
              Assessment report
            </p>
            <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {t('admin.assessmentsTitle')}
            </h1>
            <p className="mt-2 text-sm text-ink-2">
              AI-generated skill assessments, submission outcomes, and topic demand
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
            label="Assessments"
            value={data.totalAssessments.toLocaleString()}
            hint={`${derived.readyRate} ready to take`}
          />
          <InlineMetric
            label="Submissions"
            value={data.completedSubmissions.toLocaleString()}
            hint={`${derived.submissionsPerAssessment} per assessment`}
          />
          <InlineMetric
            label="Generating"
            value={derived.generating.toLocaleString()}
            hint="Awaiting AI completion"
          />
          <InlineMetric
            label="Failed"
            value={derived.failed.toLocaleString()}
            hint={`${derived.failureRate} of all assessments`}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-md border border-line bg-bg-elev p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-3">
              Generation pipeline
            </p>
            <PipelineBar data={data} />
            <dl className="mt-4 space-y-4 text-sm">
              {STATUS_ORDER.map((status) => (
                <div key={status} className="flex items-center justify-between gap-3">
                  <dt className="inline-flex items-center gap-2 capitalize text-ink-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[status] }}
                    />
                    {formatStatusLabel(status)}
                  </dt>
                  <dd className="font-semibold tabular-nums text-ink">
                    {(data.byStatus[status] ?? 0).toLocaleString()}
                    <span className="ml-2 text-xs font-normal text-ink-3">
                      {formatPercent(data.byStatus[status] ?? 0, data.totalAssessments)}
                    </span>
                  </dd>
                </div>
              ))}
              <div className="border-t border-line pt-4">
                <dt className="text-ink-3">Ready rate</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-ink">{derived.readyRate}</dd>
              </div>
              <div>
                <dt className="text-ink-3">Topics tracked</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-ink">
                  {data.byTopic.length.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-ink-3">Failure alerts</dt>
                <dd
                  className={cn(
                    'mt-0.5 font-semibold tabular-nums',
                    derived.failed > 0 ? 'text-bad' : 'text-ink',
                  )}
                >
                  {derived.failed.toLocaleString()}
                </dd>
              </div>
            </dl>
          </aside>

          <section className="rounded-md border border-line bg-bg-elev p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="font-heading text-lg font-semibold text-ink">Top topics</h2>
                <p className="mt-1 text-sm text-ink-2">
                  Most requested assessment subjects · top 10
                </p>
              </div>
              <p className="text-xs text-ink-3">
                {data.byTopic.length} topic{data.byTopic.length === 1 ? '' : 's'} ranked
              </p>
            </div>

            <div className="h-64 sm:h-72">
              {derived.topicChart.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={derived.topicChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: 'var(--ink-3)' }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={-32}
                      textAnchor="end"
                      height={56}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: 'var(--ink-3)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      {...CHART_TOOLTIP}
                      cursor={BAR_CURSOR}
                      labelFormatter={(_, payload) => {
                        const entry = payload?.[0]?.payload as { topic?: string } | undefined;
                        return entry?.topic ?? '';
                      }}
                      formatter={(value) => [
                        typeof value === 'number' ? value.toLocaleString() : String(value ?? 0),
                        'Assessments',
                      ]}
                    />
                    <Bar
                      dataKey="count"
                      radius={[4, 4, 0, 0]}
                      barSize={32}
                      fill="#007F8E"
                      activeBar={{ fill: '#009DAF' }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-ink-3">
                  No topic data recorded yet.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <section className="overflow-hidden rounded-md border border-line bg-bg-elev">
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <h2 className="font-heading text-lg font-semibold text-ink">Generation status</h2>
              <p className="mt-1 text-sm text-ink-2">Assessment records by AI pipeline state</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-bg-soft text-[11px] uppercase tracking-[0.14em] text-ink-3">
                    <th className="px-5 py-3 font-semibold sm:px-6">{t('adminCommon.colStatus')}</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">Assessments</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {derived.statusRows.length ? (
                    derived.statusRows.map((row) => (
                      <tr
                        key={row.status}
                        className="border-b border-line last:border-b-0 hover:bg-bg-soft/80"
                      >
                        <td className="px-5 py-4 capitalize sm:px-6">
                          <Badge variant={statusBadgeVariant(row.status)}>
                            {formatStatusLabel(row.status)}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 tabular-nums text-ink sm:px-6">
                          {row.count.toLocaleString()}
                        </td>
                        <td className="px-5 py-4 tabular-nums text-ink-2 sm:px-6">
                          {formatPercent(row.count, data.totalAssessments)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-ink-3">
                        No assessments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="overflow-hidden rounded-md border border-line bg-bg-elev">
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <h2 className="font-heading text-lg font-semibold text-ink">Submission levels</h2>
              <p className="mt-1 text-sm text-ink-2">Completed attempts grouped by skill level</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-bg-soft text-[11px] uppercase tracking-[0.14em] text-ink-3">
                    <th className="px-5 py-3 font-semibold sm:px-6">Level</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">Submissions</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  {derived.levelRows.some((row) => row.count > 0) ? (
                    derived.levelRows.map((row) => {
                      const levelColor =
                        LEVEL_COLORS[row.level as (typeof LEVEL_ORDER)[number]] ?? '#94A3B8';
                      return (
                        <tr
                          key={row.level}
                          className="border-b border-line last:border-b-0 hover:bg-bg-soft/80"
                        >
                          <td className="px-5 py-4 sm:px-6">
                            <span className="inline-flex items-center gap-2 text-ink">
                              <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: levelColor }}
                              />
                              {row.level}
                            </span>
                          </td>
                          <td className="px-5 py-4 tabular-nums text-ink sm:px-6">
                            {row.count.toLocaleString()}
                          </td>
                          <td className="px-5 py-4 sm:px-6">
                            <LevelMiniBar count={row.count} max={data.completedSubmissions} />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-ink-3">
                        No submissions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="mt-6 overflow-hidden rounded-md border border-line bg-bg-elev">
          <div className="border-b border-line px-5 py-4 sm:px-6">
            <h2 className="font-heading text-lg font-semibold text-ink">Topic demand log</h2>
            <p className="mt-1 text-sm text-ink-2">Ranked list of assessment topics by volume</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-bg-soft text-[11px] uppercase tracking-[0.14em] text-ink-3">
                  <th className="px-5 py-3 font-semibold sm:px-6">Rank</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">Topic</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">Assessments</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">Share</th>
                </tr>
              </thead>
              <tbody>
                {data.byTopic.length ? (
                  data.byTopic.map((row, index) => (
                    <tr
                      key={row.topic}
                      className={cn(
                        'border-b border-line last:border-b-0 hover:bg-bg-soft/80',
                        index % 2 === 0 ? 'bg-bg-elev' : 'bg-bg-soft/40',
                      )}
                    >
                      <td className="px-5 py-3 tabular-nums text-ink-3 sm:px-6">
                        {String(index + 1).padStart(2, '0')}
                      </td>
                      <td className="px-5 py-3 font-medium text-ink sm:px-6">{row.topic}</td>
                      <td className="px-5 py-3 tabular-nums text-ink sm:px-6">
                        {row.count.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 tabular-nums text-ink-2 sm:px-6">
                        {formatPercent(row.count, data.totalAssessments)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-ink-3">
                      No topic demand data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminAssessmentsPage;
