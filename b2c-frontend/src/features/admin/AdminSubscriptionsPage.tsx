'use client';

import { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import type { SubscriptionDashboard } from './adminApi';
import { useAdminSubscriptions } from './useAdmin';

const TIER_ORDER = ['free', 'standard', 'premium'] as const;
const STATUS_ORDER = ['active', 'past_due', 'incomplete', 'canceled'] as const;

const TIER_COLORS: Record<(typeof TIER_ORDER)[number], string> = {
  free: '#94A3B8',
  standard: '#007F8E',
  premium: '#F97316',
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

function statusBadgeVariant(
  status: string,
): 'default' | 'good' | 'warn' | 'bad' {
  if (status === 'active') return 'good';
  if (status === 'past_due') return 'warn';
  if (status === 'canceled') return 'bad';
  return 'default';
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, ' ');
}

function formatPercent(value: number, total: number) {
  if (total <= 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

function buildTierChart(data: SubscriptionDashboard) {
  return TIER_ORDER.map((tier) => ({
    tier,
    label: tier.charAt(0).toUpperCase() + tier.slice(1),
    users: data.usersByTier[tier],
  }));
}

function buildStatusRows(data: SubscriptionDashboard) {
  const known = new Set<string>();
  const rows: { status: string; count: number }[] = STATUS_ORDER.map((status) => {
    known.add(status);
    return {
      status,
      count: data.subscriptionsByStatus[status] ?? 0,
    };
  });

  for (const [status, count] of Object.entries(data.subscriptionsByStatus)) {
    if (!known.has(status)) rows.push({ status, count });
  }

  return rows.sort((a, b) => b.count - a.count);
}

function TierMixBar({ data }: { data: SubscriptionDashboard }) {
  const total = data.usersByTier.free + data.usersByTier.standard + data.usersByTier.premium;
  if (total <= 0) {
    return (
      <div className="mt-4 h-2 rounded-full bg-bg-soft" aria-hidden />
    );
  }

  const segments = TIER_ORDER.map((tier) => ({
    tier,
    width: (data.usersByTier[tier] / total) * 100,
  }));

  return (
    <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-bg-soft" aria-hidden>
      {segments.map((segment) =>
        segment.width > 0 ? (
          <div
            key={segment.tier}
            className="h-full transition-[width]"
            style={{
              width: `${segment.width}%`,
              backgroundColor: TIER_COLORS[segment.tier],
            }}
          />
        ) : null,
      )}
    </div>
  );
}

export function AdminSubscriptionsPage() {
  const { t } = useTranslation();
  const subsQ = useAdminSubscriptions();

  const derived = useMemo(() => {
    if (!subsQ.data) return null;

    const totalUsers =
      subsQ.data.usersByTier.free +
      subsQ.data.usersByTier.standard +
      subsQ.data.usersByTier.premium;
    const paidUsers = subsQ.data.usersByTier.standard + subsQ.data.usersByTier.premium;

    return {
      totalUsers,
      paidUsers,
      tierChart: buildTierChart(subsQ.data),
      statusRows: buildStatusRows(subsQ.data),
      paidShare: formatPercent(paidUsers, totalUsers),
      activeShare: formatPercent(
        subsQ.data.subscriptionsByStatus.active ?? 0,
        subsQ.data.totalSubscriptionRecords,
      ),
    };
  }, [subsQ.data]);

  if (subsQ.isLoading) {
    return (
      <AdminReportLoadingShell>
        <AdminSidebarChartSkeleton className="mt-6" />
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <AdminTableSectionSkeleton filterCount={0} rows={4} />
          <AdminTableSectionSkeleton filterCount={0} rows={4} />
        </div>
      </AdminReportLoadingShell>
    );
  }

  if (subsQ.isError || !subsQ.data || !derived) {
    return (
      <div className="flex w-full items-center justify-center px-4 py-20">
        <div className="rounded-md border border-line bg-bg-elev px-8 py-10 text-center">
          <p className="text-ink-2">{t('admin.accessDenied')}</p>
          <Button variant="soft" className="mt-4 rounded-md" onClick={() => subsQ.refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  const data = subsQ.data;

  return (
    <div className="w-full min-h-full bg-bg">
      <div className="border-b border-line bg-[var(--sidebar-bg)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Billing report
            </p>
            <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {t('admin.subscriptionsTitle')}
            </h1>
            <p className="mt-2 text-sm text-ink-2">
              Membership tiers, subscription status, and trial health across the platform
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-fit rounded-md bg-bg-elev"
            onClick={() => subsQ.refetch()}
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col divide-y divide-line rounded-md border border-line bg-bg-elev sm:flex-row sm:divide-x sm:divide-y-0">
          <InlineMetric
            label="Paid active"
            value={data.paidActiveSubscriptions.toLocaleString()}
            hint="Standard & premium · active billing"
          />
          <InlineMetric
            label="Subscription records"
            value={data.totalSubscriptionRecords.toLocaleString()}
            hint={`${derived.activeShare} active status`}
          />
          <InlineMetric
            label="Trials expiring"
            value={data.trialsExpiringSoon.toLocaleString()}
            hint="Within next 7 days"
          />
          <InlineMetric
            label="Platform users"
            value={derived.totalUsers.toLocaleString()}
            hint={`${derived.paidShare} on paid tiers`}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-md border border-line bg-bg-elev p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-3">
              Membership mix
            </p>
            <TierMixBar data={data} />
            <dl className="mt-4 space-y-4 text-sm">
              {TIER_ORDER.map((tier) => (
                <div key={tier} className="flex items-center justify-between gap-3">
                  <dt className="inline-flex items-center gap-2 capitalize text-ink-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: TIER_COLORS[tier] }}
                    />
                    {tier}
                  </dt>
                  <dd className="font-semibold tabular-nums text-ink">
                    {data.usersByTier[tier].toLocaleString()}
                    <span className="ml-2 text-xs font-normal text-ink-3">
                      {formatPercent(data.usersByTier[tier], derived.totalUsers)}
                    </span>
                  </dd>
                </div>
              ))}
              <div className="border-t border-line pt-4">
                <dt className="text-ink-3">Paid members</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-ink">
                  {derived.paidUsers.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-ink-3">Trials at risk</dt>
                <dd
                  className={cn(
                    'mt-0.5 font-semibold tabular-nums',
                    data.trialsExpiringSoon > 0 ? 'text-warn' : 'text-ink',
                  )}
                >
                  {data.trialsExpiringSoon.toLocaleString()}
                </dd>
              </div>
            </dl>
          </aside>

          <section className="rounded-md border border-line bg-bg-elev p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="font-heading text-lg font-semibold text-ink">Users by tier</h2>
                <p className="mt-1 text-sm text-ink-2">
                  Active accounts grouped by current membership tier
                </p>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-ink-3">
                {TIER_ORDER.map((tier) => (
                  <span key={tier} className="inline-flex items-center gap-1.5 capitalize">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: TIER_COLORS[tier] }}
                    />
                    {tier}
                  </span>
                ))}
              </div>
            </div>

            <div className="h-64 sm:h-72">
              {derived.totalUsers > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={derived.tierChart} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--line)" />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: 'var(--ink-3)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={72}
                      tick={{ fontSize: 11, fill: 'var(--ink-3)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      {...CHART_TOOLTIP}
                      cursor={BAR_CURSOR}
                      formatter={(value) => [
                        typeof value === 'number' ? value.toLocaleString() : String(value ?? 0),
                        'Users',
                      ]}
                    />
                    <Bar
                      dataKey="users"
                      radius={[0, 4, 4, 0]}
                      barSize={28}
                      activeBar={{ opacity: 0.82 }}
                    >
                      {derived.tierChart.map((entry) => (
                        <Cell key={entry.tier} fill={TIER_COLORS[entry.tier]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-ink-3">
                  No user tier data available.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <section className="overflow-hidden rounded-md border border-line bg-bg-elev">
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <h2 className="font-heading text-lg font-semibold text-ink">Subscription status</h2>
              <p className="mt-1 text-sm text-ink-2">
                Billing records by Stripe-synced status
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-bg-soft text-[11px] uppercase tracking-[0.14em] text-ink-3">
                    <th className="px-5 py-3 font-semibold sm:px-6">Status</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">Records</th>
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
                          {formatPercent(row.count, data.totalSubscriptionRecords)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-ink-3">
                        No subscription records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="overflow-hidden rounded-md border border-line bg-bg-elev">
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <h2 className="font-heading text-lg font-semibold text-ink">Tier membership</h2>
              <p className="mt-1 text-sm text-ink-2">
                User accounts by entitlements tier
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-bg-soft text-[11px] uppercase tracking-[0.14em] text-ink-3">
                    <th className="px-5 py-3 font-semibold sm:px-6">Tier</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">Users</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {TIER_ORDER.map((tier) => (
                    <tr
                      key={tier}
                      className="border-b border-line last:border-b-0 hover:bg-bg-soft/80"
                    >
                      <td className="px-5 py-4 sm:px-6">
                        <span className="inline-flex items-center gap-2 capitalize text-ink">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: TIER_COLORS[tier] }}
                          />
                          {tier}
                        </span>
                      </td>
                      <td className="px-5 py-4 tabular-nums text-ink sm:px-6">
                        {data.usersByTier[tier].toLocaleString()}
                      </td>
                      <td className="px-5 py-4 tabular-nums text-ink-2 sm:px-6">
                        {formatPercent(data.usersByTier[tier], derived.totalUsers)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default AdminSubscriptionsPage;
