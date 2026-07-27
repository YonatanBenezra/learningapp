'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  DollarSign,
  Receipt,
  Search,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
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
import { Skeleton } from '@/src/components/ui/skeleton';
import { formatMoney, type InstructorSale } from '@/src/domain/instructor';
import { useInstructorSales } from '@/src/features/instructor/useInstructor';
import { useTheme } from '@/src/providers';
import { cn } from '@/src/lib/utils';

type StatusFilter = 'all' | InstructorSale['status'];

function useChartPalette() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return {
    grid: isDark ? '#2B3648' : '#E2E8F0',
    tick: isDark ? '#778396' : '#94A3B8',
    bar: isDark ? '#22D3EE' : '#007F8E',
  };
}

function formatSaleDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function formatSaleTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));
}

function buildSalesChartData(sales: InstructorSale[]) {
  const byDay = new Map<string, number>();

  for (const sale of sales) {
    if (sale.status !== 'completed') continue;
    const key = new Date(sale.purchasedAt).toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + sale.amountCents / 100);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([day, revenue]) => ({
      label: formatShortDate(day),
      revenue: Math.round(revenue),
    }));
}

function computeStats(sales: InstructorSale[]) {
  const completed = sales.filter((sale) => sale.status === 'completed');
  const totalRevenueCents = completed.reduce((sum, sale) => sum + sale.amountCents, 0);
  const totalSales = sales.length;
  const completedCount = completed.length;
  const avgSaleCents =
    completedCount > 0 ? Math.round(totalRevenueCents / completedCount) : 0;

  return { totalRevenueCents, totalSales, completedCount, avgSaleCents };
}

function SalesTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-bg-elev px-3 py-2 shadow-soft">
      <p className="text-xs font-semibold text-ink">{label}</p>
      <p className="mt-1 text-xs text-ink-2">
        Revenue:{' '}
        <span className="font-semibold text-ink">
          {formatMoney(Math.round(payload[0].value * 100))}
        </span>
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ElementType;
  accent: 'primary' | 'good' | 'warn' | 'secondary';
}) {
  const accents = {
    primary: 'border-primary/30 bg-primary-soft text-primary',
    good: 'border-good/30 bg-good-soft text-good',
    warn: 'border-warn/30 bg-warn-soft text-warn',
    secondary: 'border-secondary/30 bg-tint-peach text-secondary',
  };

  return (
    <div className="rounded-lg border border-line bg-bg-elev p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-2">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-ink">{value}</p>
          {hint ? <p className="mt-1 text-xs text-ink-3">{hint}</p> : null}
        </div>
        <span
          className={cn(
            'grid size-12 shrink-0 place-items-center rounded-lg border',
            accents[accent],
          )}
        >
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: InstructorSale['status'] }) {
  if (status === 'completed') {
    return <Badge variant="good">Completed</Badge>;
  }
  if (status === 'pending') {
    return <Badge variant="warn">Pending</Badge>;
  }
  return <Badge variant="bad">Refunded</Badge>;
}

function SalesPageSkeleton() {
  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 xl:px-10">
      <Skeleton className="h-28 w-full rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-lg" />
      <Skeleton className="h-96 rounded-lg" />
    </div>
  );
}

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'completed', label: 'Completed' },
  { id: 'pending', label: 'Pending' },
  { id: 'refunded', label: 'Refunded' },
];

export function InstructorSalesPage() {
  const palette = useChartPalette();
  const { data, isLoading, isError, refetch } = useInstructorSales();
  const sales = data?.sales ?? [];
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const stats = useMemo(() => computeStats(sales), [sales]);
  const chartData = useMemo(() => buildSalesChartData(sales), [sales]);

  const filteredSales = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return sales.filter((sale) => {
      if (statusFilter !== 'all' && sale.status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      const haystack = [sale.courseTitle ?? '', sale.studentEmail, sale.status]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [sales, query, statusFilter]);

  if (isLoading) {
    return (
      <div className="min-h-full bg-gradient-to-b from-primary/[0.04] via-bg to-bg">
        <SalesPageSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-full bg-gradient-to-b from-primary/[0.04] via-bg to-bg p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg border border-line bg-bg-elev p-10 text-center shadow-soft">
          <p className="text-lg font-semibold text-ink">Could not load sales data.</p>
          <p className="mt-2 text-sm text-ink-2">Check your connection and try again.</p>
          <Button variant="soft" className="mt-4 rounded-lg" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-primary/[0.04] via-bg to-bg">
      <div className="space-y-8 p-4 sm:p-6 lg:p-8 xl:px-10">
        <section className="rounded-lg border border-line bg-bg-elev p-6 shadow-soft sm:p-8">
          <nav className="flex flex-wrap items-center gap-1.5 text-sm text-ink-3">
            <Link href="/instructor/dashboard" className="transition hover:text-primary">
              Instructor hub
            </Link>
            <ChevronRight className="size-3.5" />
            <span className="font-medium text-ink">Sales</span>
          </nav>

          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                Revenue
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Sales & transactions
              </h1>
              <p className="mt-3 text-base leading-7 text-ink-2">
                Track enrollments, payment status, and earnings from your marketplace courses in
                one place.
              </p>
            </div>
            <Link href="/instructor/courses">
              <Button variant="soft" className="rounded-lg">
                Manage courses
                <ArrowUpRight className="size-4" />
              </Button>
            </Link>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total revenue"
            value={formatMoney(stats.totalRevenueCents)}
            hint="From completed sales"
            icon={DollarSign}
            accent="primary"
          />
          <StatCard
            label="Total transactions"
            value={String(stats.totalSales)}
            hint={`${stats.completedCount} completed`}
            icon={ShoppingBag}
            accent="secondary"
          />
          <StatCard
            label="Average order"
            value={formatMoney(stats.avgSaleCents)}
            hint="Per completed sale"
            icon={TrendingUp}
            accent="good"
          />
          <StatCard
            label="Reporting period"
            value={chartData.length > 0 ? `${chartData.length} days` : '—'}
            hint="Recent daily activity"
            icon={Receipt}
            accent="warn"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <section className="rounded-lg border border-line bg-bg-elev p-5 shadow-soft sm:p-6 xl:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-ink">Revenue trend</h2>
                <p className="mt-1 text-sm text-ink-2">Completed sales over the last two weeks</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-bg-soft px-3 py-1.5 text-xs font-medium text-ink-2">
                <BarChart3 className="size-3.5 text-primary" />
                Daily totals
              </span>
            </div>

            {chartData.length === 0 ? (
              <div className="mt-8 flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-line-2 bg-bg-soft/40 px-6 text-center">
                <BarChart3 className="size-10 text-ink-3" />
                <p className="mt-4 font-semibold text-ink">No revenue data yet</p>
                <p className="mt-2 max-w-sm text-sm text-ink-2">
                  Publish a priced course and your completed sales will appear here.
                </p>
              </div>
            ) : (
              <div className="mt-6 h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke={palette.grid} strokeDasharray="4 4" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: palette.tick, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: palette.tick, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip content={<SalesTooltip />} cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="revenue" fill={palette.bar} radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-line bg-bg-elev p-5 shadow-soft sm:p-6">
            <h2 className="text-lg font-bold text-ink">Summary</h2>
            <p className="mt-1 text-sm text-ink-2">Current sales breakdown</p>
            <dl className="mt-5 space-y-4">
              {(
                [
                  ['Completed', sales.filter((sale) => sale.status === 'completed').length],
                  ['Pending', sales.filter((sale) => sale.status === 'pending').length],
                  ['Refunded', sales.filter((sale) => sale.status === 'refunded').length],
                ] as const
              ).map(([label, count]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 border-b border-line pb-4 last:border-0 last:pb-0"
                >
                  <dt className="text-sm text-ink-2">{label}</dt>
                  <dd className="text-sm font-semibold text-ink">{count}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 rounded-lg border border-primary/20 bg-primary-soft/30 p-4 text-sm leading-6 text-ink-2">
              Revenue totals include completed transactions only. Pending and refunded orders are
              listed separately in the transaction table.
            </div>
          </section>
        </div>

        <section className="overflow-hidden rounded-lg border border-line bg-bg-elev shadow-soft">
          <div className="border-b border-line px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-ink">Transaction history</h2>
                <p className="mt-1 text-sm text-ink-2">
                  {filteredSales.length} of {sales.length} records shown
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-[240px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search course or student..."
                    className="h-10 w-full rounded-lg border border-line-2 bg-bg py-2 pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-ink-3 focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>

                <div className="inline-flex flex-wrap gap-1 rounded-lg border border-line bg-bg-soft p-1">
                  {STATUS_FILTERS.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setStatusFilter(filter.id)}
                      className={cn(
                        'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                        statusFilter === filter.id
                          ? 'bg-bg-elev text-ink shadow-soft'
                          : 'text-ink-2 hover:text-ink',
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {sales.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
                <ShoppingBag className="size-7" />
              </div>
              <p className="mt-4 text-lg font-semibold text-ink">No sales recorded yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">
                When learners purchase your published courses, each enrollment and payment will
                appear in this ledger.
              </p>
              <Link href="/instructor/courses/new" className="mt-6 inline-block">
                <Button className="rounded-lg bg-primary hover:bg-primary-dark">
                  Create a course
                </Button>
              </Link>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-ink-2">
              No transactions match your search or filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-line bg-bg-soft text-ink-3">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold sm:px-6">Course</th>
                    <th className="px-5 py-3.5 font-semibold sm:px-6">Student</th>
                    <th className="px-5 py-3.5 font-semibold sm:px-6">Amount</th>
                    <th className="px-5 py-3.5 font-semibold sm:px-6">Status</th>
                    <th className="px-5 py-3.5 font-semibold sm:px-6">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="border-b border-line transition-colors last:border-0 hover:bg-bg-soft/60"
                    >
                      <td className="px-5 py-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-bg-soft text-primary">
                            <ShoppingBag className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ink">
                              {sale.courseTitle ?? 'Course'}
                            </p>
                            <p className="mt-0.5 text-xs text-ink-3">Marketplace enrollment</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-ink-2 sm:px-6">
                        <p className="truncate">{sale.studentEmail}</p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-ink sm:px-6">
                        {formatMoney(sale.amountCents, sale.currency)}
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        <StatusBadge status={sale.status} />
                      </td>
                      <td className="px-5 py-4 text-ink-2 sm:px-6">
                        <p>{formatSaleDate(sale.purchasedAt)}</p>
                        <p className="mt-0.5 text-xs text-ink-3">{formatSaleTime(sale.purchasedAt)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default InstructorSalesPage;
