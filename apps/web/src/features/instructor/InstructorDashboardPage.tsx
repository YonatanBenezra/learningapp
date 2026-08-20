'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronRight,
  DollarSign,
  Plus,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
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
import { Button } from '@/src/components/ui/button';
import { Skeleton } from '@/src/components/ui/skeleton';
import { formatMoney, type InstructorSale } from '@/src/domain/instructor';
import {
  useInstructorCourses,
  useInstructorDashboard,
} from '@/src/features/instructor/useInstructor';
import { useAuthStore } from '@/src/store/authStore';
import { getUserDisplayName } from '@/src/lib/userDisplay';
import { useTranslation, useLocaleDateFormatter } from '@/src/i18n';
import { useTheme } from '@/src/providers';
import { cn } from '@/src/lib/utils';

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

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));
}

function buildSalesChartData(sales: InstructorSale[]) {
  const byDay = new Map<string, number>();

  for (const sale of sales) {
    const key = new Date(sale.purchasedAt).toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + sale.amountCents / 100);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([day, revenue]) => ({
      label: formatShortDate(day),
      revenue: Math.round(revenue),
    }));
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <Skeleton className="h-40 w-full rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-96 rounded-lg xl:col-span-2" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
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
    <div className="rounded-lg border border-line bg-bg-elev p-5">
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

function SalesTooltip({
  active,
  payload,
  label,
  revenueLabel,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  revenueLabel: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-bg-elev px-3 py-2">
      <p className="text-xs font-semibold text-ink">{label}</p>
      <p className="mt-1 text-xs text-ink-2">
        {revenueLabel}:{' '}
        <span className="font-semibold text-ink">
          {formatMoney(Math.round(payload[0].value * 100))}
        </span>
      </p>
    </div>
  );
}

function RecentSaleRow({ sale, courseLabel }: { sale: InstructorSale; courseLabel: string }) {
  return (
    <div className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-0">
      <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-bg-soft text-primary">
        <ShoppingBag className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">{sale.courseTitle ?? courseLabel}</p>
        <p className="mt-0.5 truncate text-sm text-ink-2">{sale.studentEmail}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-ink">{formatMoney(sale.amountCents, sale.currency)}</p>
        <p className="mt-0.5 text-xs text-ink-3">{formatSaleDate(sale.purchasedAt)}</p>
      </div>
    </div>
  );
}

export function InstructorDashboardPage() {
  const { t } = useTranslation();
  const formatDate = useLocaleDateFormatter();
  const user = useAuthStore((state) => state.user);
  const palette = useChartPalette();
  const { data, isLoading, isError, refetch } = useInstructorDashboard();
  const { data: coursesData } = useInstructorCourses();

  const courses = coursesData?.courses ?? [];
  const courseInsights = useMemo(() => {
    const published = courses.filter((course) => course.isPublished).length;
    const drafts = courses.filter((course) => course.status === 'ready' && !course.isPublished).length;
    const generating = courses.filter((course) => course.status === 'generating').length;
    const failed = courses.filter((course) => course.status === 'failed').length;
    return { published, drafts, generating, failed };
  }, [courses]);

  const displayName = getUserDisplayName(user, { fallback: 'Instructor' });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg border border-line bg-bg-elev p-10 text-center">
          <p className="text-lg font-semibold text-ink">{t('instructor.loadDashboardError')}</p>
          <p className="mt-2 text-sm text-ink-2">{t('instructor.checkConnection')}</p>
          <Button variant="soft" className="mt-4 rounded-lg" onClick={() => refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  const { stats, recentSales } = data;
  const chartData = buildSalesChartData(recentSales);
  const avgSale =
    stats.totalSales > 0
      ? formatMoney(Math.round(stats.totalRevenueCents / stats.totalSales))
      : formatMoney(0);

  return (
    <div className="min-h-full bg-gradient-to-b from-primary/[0.04] via-bg to-bg">
      <div className="space-y-8 p-4 sm:p-6 lg:p-8">
        <section className="rounded-lg border border-line bg-bg-elev p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                {t('instructor.hub')}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                {t('instructor.welcomeBack', { name: displayName })}
              </h1>
              <p className="mt-3 text-base leading-7 text-ink-2">{t('instructor.hubDesc')}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/instructor/courses/new">
                <Button className="rounded-lg bg-primary hover:bg-primary-dark">
                  <Plus className="size-4" />
                  {t('instructor.createCourse')}
                </Button>
              </Link>
              <Link href="/instructor/courses">
                <Button variant="soft" className="rounded-lg">
                  <BookOpen className="size-4" />
                  {t('instructor.myCourses')}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t('instructor.totalCourses')}
            value={String(stats.totalCourses)}
            hint={`${courseInsights.drafts} ${t('instructor.hintDraft')} · ${courseInsights.generating} ${t('instructor.hintGenerating')}`}
            icon={BookOpen}
            accent="primary"
          />
          <StatCard
            label={t('instructor.published')}
            value={String(stats.publishedCourses)}
            hint={t('instructor.hintLive')}
            icon={TrendingUp}
            accent="good"
          />
          <StatCard
            label={t('instructor.totalSales')}
            value={String(stats.totalSales)}
            hint={`${t('instructor.hintAvgOrder')} ${avgSale}`}
            icon={ShoppingBag}
            accent="warn"
          />
          <StatCard
            label={t('instructor.totalRevenue')}
            value={formatMoney(stats.totalRevenueCents)}
            hint={t('instructor.hintEnrollments')}
            icon={DollarSign}
            accent="secondary"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <div className="rounded-lg border border-line bg-bg-elev">
              <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
                <div>
                  <h2 className="text-lg font-bold text-ink">{t('instructor.revenueSnapshot')}</h2>
                  <p className="mt-1 text-sm text-ink-2">{t('instructor.revenueSnapshotDesc')}</p>
                </div>
                <BarChart3 className="size-5 text-primary" />
              </div>
              <div className="px-4 py-5 sm:px-6">
                {chartData.length === 0 ? (
                  <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-line bg-bg-soft/40 px-6 text-center">
                    <Sparkles className="size-8 text-ink-3" />
                    <p className="mt-4 text-base font-semibold text-ink">{t('instructor.noRevenueYet')}</p>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-ink-2">{t('instructor.noRevenueHint')}</p>
                    <Link href="/instructor/courses/new" className="mt-5">
                      <Button className="rounded-lg bg-primary hover:bg-primary-dark">
                        {t('instructor.createFirstCourse')}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 12, fill: palette.tick }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: palette.tick }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<SalesTooltip revenueLabel={t('instructor.revenue')} />} />
                        <Bar
                          dataKey="revenue"
                          fill={palette.bar}
                          radius={[6, 6, 0, 0]}
                          barSize={28}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-line bg-bg-elev">
              <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
                <div>
                  <h2 className="text-lg font-bold text-ink">{t('instructor.recentSales')}</h2>
                  <p className="mt-1 text-sm text-ink-2">{t('instructor.recentSalesDesc')}</p>
                </div>
                <Link
                  href="/instructor/sales"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  {t('instructor.viewAll')}
                  <ChevronRight className="size-4" />
                </Link>
              </div>
              {recentSales.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-ink-2">{t('instructor.noSalesHint')}</div>
              ) : (
                <div>
                  {recentSales.map((sale) => (
                    <RecentSaleRow key={sale.id} sale={sale} courseLabel={t('instructor.course')} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-line bg-bg-elev p-5 sm:p-6">
              <h2 className="text-lg font-bold text-ink">{t('instructor.coursePipeline')}</h2>
              <p className="mt-1 text-sm text-ink-2">{t('instructor.manageCourses')}</p>
              <dl className="mt-5 space-y-4">
                {[
                  { label: t('instructor.published'), value: courseInsights.published, tone: 'text-good' },
                  { label: t('instructor.drafts'), value: courseInsights.drafts, tone: 'text-warn' },
                  { label: t('instructor.generating'), value: courseInsights.generating, tone: 'text-primary' },
                  { label: t('instructor.needsAttention'), value: courseInsights.failed, tone: 'text-bad' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg border border-line bg-bg-soft/50 px-4 py-3"
                  >
                    <dt className="text-sm font-medium text-ink-2">{item.label}</dt>
                    <dd className={cn('text-xl font-bold tabular-nums', item.tone)}>{item.value}</dd>
                  </div>
                ))}
              </dl>
              <Link href="/instructor/courses" className="mt-5 block">
                <Button variant="soft" className="w-full rounded-lg">
                  {t('instructor.manageCourses')}
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>

            <div className="rounded-lg border border-line bg-bg-elev p-5 sm:p-6">
              <div className="mt-5 space-y-3">
                {[
                  {
                    href: '/instructor/courses/new',
                    title: t('instructor.launchNewCourse'),
                    desc: t('instructor.launchNewCourseDesc'),
                    icon: Plus,
                  },
                  {
                    href: '/instructor/sales',
                    title: t('instructor.reviewSales'),
                    desc: t('instructor.reviewSalesDesc'),
                    icon: Users,
                  },
                  {
                    href: '/instructor/courses',
                    title: t('instructor.editPublished'),
                    desc: t('instructor.editPublishedDesc'),
                    icon: BookOpen,
                  },
                ].map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-start gap-3 rounded-lg border border-line bg-bg-soft/40 p-4 transition hover:border-primary/30 hover:bg-bg-soft"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-bg-elev text-primary">
                      <action.icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink">{action.title}</span>
                      <span className="mt-1 block text-sm text-ink-2">{action.desc}</span>
                    </span>
                    <ChevronRight className="ml-auto size-4 shrink-0 text-ink-3" />
                  </Link>
                ))}
              </div>
            </div>

            {courses.length > 0 ? (
              <div className="rounded-lg border border-line bg-bg-elev p-5 sm:p-6">
                <h2 className="text-lg font-bold text-ink">{t('instructor.latestCourses')}</h2>
                <div className="mt-4 space-y-3">
                  {courses.slice(0, 3).map((course) => (
                    <Link
                      key={course.id}
                      href={`/instructor/courses/${course.id}`}
                      className="block rounded-lg border border-line bg-bg-soft/40 px-4 py-3 transition hover:border-primary/30"
                    >
                      <p className="truncate font-semibold text-ink">{course.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-ink-3">
                        {course.isPublished ? t('instructor.published') : course.status} ·{' '}
                        {formatMoney(course.priceCents, course.currency)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

export default InstructorDashboardPage;
