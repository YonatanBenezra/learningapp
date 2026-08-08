'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, Coins, Cpu, RefreshCw } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTranslation } from '@/src/i18n';
import { Button } from '@/src/components/ui/button';
import {
  AdminReportLoadingShell,
  AdminSidebarChartSkeleton,
  AdminTableSectionSkeleton,
} from './AdminUi';
import type { CostDashboard } from './adminApi';
import { useAdminCosts } from './useAdmin';

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
    <div className="min-w-[120px] flex-1 px-5 py-4 sm:px-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-3">{label}</p>
      <p className="mt-1.5 font-heading text-2xl font-semibold tabular-nums text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-3">{hint}</p> : null}
    </div>
  );
}

function formatCost(value: number, digits = 4) {
  if (value >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(digits)}`;
}

function formatPercent(value: number, total: number) {
  if (total <= 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

function truncateLabel(value: string, max = 16) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function buildUseCaseChart(data: CostDashboard) {
  return data.byUseCase.map((row) => ({
    ...row,
    label: truncateLabel(row.useCase),
  }));
}

function buildModelChart(data: CostDashboard) {
  return data.byModel.map((row) => ({
    ...row,
    label: truncateLabel(row.model, 14),
  }));
}

export function AdminCostsPage() {
  const { t } = useTranslation();
  const costsQ = useAdminCosts();

  const derived = useMemo(() => {
    if (!costsQ.data) return null;

    const totalTokens = costsQ.data.inputTokens + costsQ.data.outputTokens;
    return {
      totalTokens,
      useCaseChart: buildUseCaseChart(costsQ.data),
      modelChart: buildModelChart(costsQ.data),
      avgCostPerCall:
        costsQ.data.totalCalls > 0
          ? formatCost(costsQ.data.totalCostUsd / costsQ.data.totalCalls)
          : formatCost(0),
      inputShare: formatPercent(costsQ.data.inputTokens, totalTokens),
      outputShare: formatPercent(costsQ.data.outputTokens, totalTokens),
    };
  }, [costsQ.data]);

  if (costsQ.isLoading) {
    return (
      <AdminReportLoadingShell>
        <AdminSidebarChartSkeleton className="mt-6" />
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <AdminTableSectionSkeleton filterCount={0} rows={4} />
          <AdminTableSectionSkeleton filterCount={0} rows={4} />
        </div>
        <AdminTableSectionSkeleton className="mt-6" filterCount={0} rows={6} />
      </AdminReportLoadingShell>
    );
  }

  if (costsQ.isError || !costsQ.data || !derived) {
    return (
      <div className="flex w-full items-center justify-center px-4 py-20">
        <div className="rounded-md border border-line bg-bg-elev px-8 py-10 text-center">
          <p className="text-ink-2">{t('admin.accessDenied')}</p>
          <Button variant="soft" className="mt-4 rounded-md" onClick={() => costsQ.refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  const data = costsQ.data;

  return (
    <div className="w-full min-h-full bg-bg">
      <div className="border-b border-line bg-[var(--sidebar-bg)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              AI cost registry
            </p>
            <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {t('admin.costsTitle')}
            </h1>
            <p className="mt-2 text-sm text-ink-2">
              Platform AI spend, token consumption, and usage attribution by case and model
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-fit rounded-md bg-bg-elev"
            onClick={() => costsQ.refetch()}
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col divide-y divide-line rounded-md border border-line bg-bg-elev sm:flex-row sm:divide-x sm:divide-y-0">
          <InlineMetric
            label="Total spend"
            value={formatCost(data.totalCostUsd, 2)}
            hint={`${derived.avgCostPerCall} avg per call`}
          />
          <InlineMetric label="API calls" value={data.totalCalls.toLocaleString()} />
          <InlineMetric
            label="Input tokens"
            value={data.inputTokens.toLocaleString()}
            hint={`${derived.inputShare} of tokens`}
          />
          <InlineMetric
            label="Output tokens"
            value={data.outputTokens.toLocaleString()}
            hint={`${derived.outputShare} of tokens`}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-md border border-line bg-bg-elev p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-3">
              Spend summary
            </p>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-ink-3">Total tokens</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-ink">
                  {derived.totalTokens.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-ink-3">Use cases tracked</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-ink">
                  {data.byUseCase.length}
                </dd>
              </div>
              <div>
                <dt className="text-ink-3">Models tracked</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-ink">
                  {data.byModel.length}
                </dd>
              </div>
              <div>
                <dt className="text-ink-3">Top spenders</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-ink">
                  {data.topUsers.length}
                </dd>
              </div>
              <div className="border-t border-line pt-4">
                <dt className="text-ink-3">Avg cost / call</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-primary">
                  {derived.avgCostPerCall}
                </dd>
              </div>
            </dl>
          </aside>

          <section className="rounded-md border border-line bg-bg-elev p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="font-heading text-lg font-semibold text-ink">Cost by use case</h2>
                <p className="mt-1 text-sm text-ink-2">AI spend grouped by product use case</p>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs text-ink-3">
                <Coins className="size-3.5 text-primary" />
                USD
              </div>
            </div>

            <div className="h-64 sm:h-72">
              {derived.useCaseChart.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={derived.useCaseChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: 'var(--ink-3)' }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={-24}
                      textAnchor="end"
                      height={52}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--ink-3)' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `$${Number(value).toFixed(2)}`}
                    />
                    <Tooltip
                      {...CHART_TOOLTIP}
                      cursor={BAR_CURSOR}
                      labelFormatter={(_, payload) => {
                        const entry = payload?.[0]?.payload as { useCase?: string } | undefined;
                        return entry?.useCase ?? '';
                      }}
                      formatter={(value) => [
                        typeof value === 'number' ? formatCost(value) : String(value ?? 0),
                        'Cost',
                      ]}
                    />
                    <Bar
                      dataKey="costUsd"
                      radius={[4, 4, 0, 0]}
                      barSize={32}
                      fill="#007F8E"
                      activeBar={{ fill: '#009DAF' }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-ink-3">
                  No AI usage recorded yet.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <section className="overflow-hidden rounded-md border border-line bg-bg-elev">
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <h2 className="font-heading text-lg font-semibold text-ink">Use case ledger</h2>
              <p className="mt-1 text-sm text-ink-2">Spend and call volume by use case</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-bg-soft text-[11px] uppercase tracking-[0.14em] text-ink-3">
                    <th className="px-5 py-3 font-semibold sm:px-6">Use case</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">Cost</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">Calls</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byUseCase.length ? (
                    data.byUseCase.map((row) => (
                      <tr
                        key={row.useCase}
                        className="border-b border-line last:border-b-0 hover:bg-bg-soft/80"
                      >
                        <td className="px-5 py-4 font-medium text-ink sm:px-6">{row.useCase}</td>
                        <td className="px-5 py-4 tabular-nums text-ink sm:px-6">
                          {formatCost(row.costUsd)}
                        </td>
                        <td className="px-5 py-4 tabular-nums text-ink-2 sm:px-6">
                          {row.calls.toLocaleString()}
                        </td>
                        <td className="px-5 py-4 tabular-nums text-ink-2 sm:px-6">
                          {formatPercent(row.costUsd, data.totalCostUsd)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-ink-3">
                        No use case data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="overflow-hidden rounded-md border border-line bg-bg-elev">
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2">
                <Cpu className="size-4 text-primary" />
                <h2 className="font-heading text-lg font-semibold text-ink">Model ledger</h2>
              </div>
              <p className="mt-1 text-sm text-ink-2">Spend and call volume by AI model</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-bg-soft text-[11px] uppercase tracking-[0.14em] text-ink-3">
                    <th className="px-5 py-3 font-semibold sm:px-6">Model</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">Cost</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">Calls</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byModel.length ? (
                    data.byModel.map((row) => (
                      <tr
                        key={row.model}
                        className="border-b border-line last:border-b-0 hover:bg-bg-soft/80"
                      >
                        <td className="px-5 py-4 font-medium text-ink sm:px-6">{row.model}</td>
                        <td className="px-5 py-4 tabular-nums text-ink sm:px-6">
                          {formatCost(row.costUsd)}
                        </td>
                        <td className="px-5 py-4 tabular-nums text-ink-2 sm:px-6">
                          {row.calls.toLocaleString()}
                        </td>
                        <td className="px-5 py-4 tabular-nums text-ink-2 sm:px-6">
                          {formatPercent(row.costUsd, data.totalCostUsd)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-ink-3">
                        No model data available.
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
            <h2 className="font-heading text-lg font-semibold text-ink">Top users by AI spend</h2>
            <p className="mt-1 text-sm text-ink-2">
              Highest consuming accounts · top {data.topUsers.length} records
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-bg-soft text-[11px] uppercase tracking-[0.14em] text-ink-3">
                  <th className="px-5 py-3 font-semibold sm:px-6">Rank</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">User ID</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">Cost (USD)</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">Calls</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">Share</th>
                </tr>
              </thead>
              <tbody>
                {data.topUsers.length ? (
                  data.topUsers.map((row, index) => (
                    <tr
                      key={row.userId}
                      className="border-b border-line last:border-b-0 hover:bg-bg-soft/80"
                    >
                      <td className="px-5 py-4 tabular-nums text-ink-3 sm:px-6">
                        {String(index + 1).padStart(2, '0')}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-ink sm:px-6">
                        {row.userId.slice(0, 12)}…
                      </td>
                      <td className="px-5 py-4 tabular-nums font-medium text-primary sm:px-6">
                        {formatCost(row.costUsd)}
                      </td>
                      <td className="px-5 py-4 tabular-nums text-ink sm:px-6">
                        {row.calls.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 tabular-nums text-ink-2 sm:px-6">
                        {formatPercent(row.costUsd, data.totalCostUsd)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-ink-3">
                      No AI usage recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end border-t border-line bg-bg-soft/50 px-5 py-4 sm:px-6">
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View user directory
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminCostsPage;
