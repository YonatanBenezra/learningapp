'use client';

import { RefreshCw } from 'lucide-react';
import {
  Area,
  AreaChart,
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
import { cn } from '@/src/lib/utils';
import type { ActivityDashboard } from './adminApi';
import { useAdminActivity } from './useAdmin';

type DailyRow = {
  date: string;
  signups: number;
  quiz: number;
  exam: number;
  exercises: number;
  learning: number;
};

function buildDailyLog(data: ActivityDashboard): DailyRow[] {
  const map = new Map<string, DailyRow>();

  for (const row of data.signupsByDay) {
    map.set(row.date, {
      date: row.date,
      signups: row.count,
      quiz: 0,
      exam: 0,
      exercises: 0,
      learning: 0,
    });
  }

  for (const row of data.learningActivityByDay) {
    const entry = map.get(row.date) ?? {
      date: row.date,
      signups: 0,
      quiz: 0,
      exam: 0,
      exercises: 0,
      learning: 0,
    };
    entry.quiz = row.quiz;
    entry.exam = row.exam;
    entry.exercises = row.exercises;
    entry.learning = row.quiz + row.exam + row.exercises;
    map.set(row.date, entry);
  }

  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}

function InlineMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[140px] flex-1 px-5 py-4 sm:px-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-3">{label}</p>
      <p className="mt-1.5 font-heading text-2xl font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}

export function AdminActivityPage() {
  const { t } = useTranslation();
  const dataQ = useAdminActivity();

  if (dataQ.isLoading) {
    return (
      <AdminReportLoadingShell>
        <AdminSidebarChartSkeleton className="mt-6" />
        <AdminTableSectionSkeleton className="mt-6" filterCount={0} rows={8} />
      </AdminReportLoadingShell>
    );
  }

  if (dataQ.isError || !dataQ.data) {
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
  const dailyLog = buildDailyLog(data);
  const chartData = dailyLog.map((row) => ({
    ...row,
    label: formatShortDate(row.date),
    activity: row.signups + row.learning,
  }));

  return (
    <div className="w-full min-h-full bg-bg">
      {/* Report header — distinct from metrics dashboard */}
      <div className="border-b border-line bg-[var(--sidebar-bg)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Activity report
            </p>
            <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {t('admin.activityTitle')}
            </h1>
            <p className="mt-2 text-sm text-ink-2">
              Daily signups and learning submissions · rolling 14-day window
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-ink-3">
            <span>Updated {new Date(data.generatedAt).toLocaleString()}</span>
            <Button
              variant="outline"
              size="sm"
              className="rounded-md bg-bg-elev"
              onClick={() => dataQ.refetch()}
            >
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Compact metric strip — no cards */}
        <div className="flex flex-col divide-y divide-line rounded-md border border-line bg-bg-elev sm:flex-row sm:divide-x sm:divide-y-0">
          <InlineMetric label="Signups · 7d" value={data.signups7d.toLocaleString()} />
          <InlineMetric label="Signups · 30d" value={data.signups30d.toLocaleString()} />
          <InlineMetric label="Active users" value={data.activeUsers.toLocaleString()} />
          <InlineMetric label="Learning · 7d" value={data.learningEvents7d.toLocaleString()} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Sidebar summary — list style, not KPI cards */}
          <aside className="rounded-md border border-line bg-bg-elev p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-3">
              Period notes
            </p>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-ink-3">14-day signups</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-ink">
                  {data.signups14dTotal.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-ink-3">Daily average (7d)</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-ink">
                  {data.avgDailySignups7d.toFixed(1)}
                </dd>
              </div>
              <div>
                <dt className="text-ink-3">Peak signup day</dt>
                <dd className="mt-0.5 font-semibold text-ink">
                  {data.peakSignupDay
                    ? `${formatShortDate(data.peakSignupDay)} · ${data.peakSignupCount}`
                    : '—'}
                </dd>
              </div>
              <div className="border-t border-line pt-4">
                <dt className="text-ink-3">Lessons completed</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-ink">
                  {data.lessonCompletions.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-ink-3">Quiz / Exam / Exercise (7d)</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-ink">
                  {data.quizSubmissions7d} / {data.examSubmissions7d} /{' '}
                  {data.exerciseSubmissions7d}
                </dd>
              </div>
            </dl>
          </aside>

          {/* Single trend chart */}
          <section className="rounded-md border border-line bg-bg-elev p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="font-heading text-lg font-semibold text-ink">Daily activity</h2>
                <p className="mt-1 text-sm text-ink-2">
                  Combined signups and learning submissions
                </p>
              </div>
              <div className="flex gap-4 text-xs text-ink-3">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-primary" />
                  Signups
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-secondary" />
                  Learning
                </span>
              </div>
            </div>

            <div className="h-64 sm:h-72">
              {chartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#007F8E" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#007F8E" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="learningFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F97316" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#F97316" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: 'var(--ink-3)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: 'var(--ink-3)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 6,
                        border: '1px solid var(--line)',
                        background: 'var(--bg-elev)',
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="signups"
                      name="Signups"
                      stroke="#007F8E"
                      fill="url(#signupFill)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="learning"
                      name="Learning"
                      stroke="#F97316"
                      fill="url(#learningFill)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-ink-3">
                  No activity recorded in the last 14 days.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Data table — primary detail view */}
        <section className="mt-6 overflow-hidden rounded-md border border-line bg-bg-elev">
          <div className="border-b border-line px-5 py-4 sm:px-6">
            <h2 className="font-heading text-lg font-semibold text-ink">Daily log</h2>
            <p className="mt-1 text-sm text-ink-2">Row-level activity for the reporting period</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-bg-soft text-[11px] uppercase tracking-[0.14em] text-ink-3">
                  <th className="px-5 py-3 font-semibold sm:px-6">Date</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">Signups</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">Quizzes</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">Exams</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">Exercises</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">Total</th>
                </tr>
              </thead>
              <tbody>
                {dailyLog.length ? (
                  dailyLog.map((row, index) => {
                    const total = row.signups + row.learning;
                    return (
                      <tr
                        key={row.date}
                        className={cn(
                          'border-b border-line last:border-b-0',
                          index % 2 === 0 ? 'bg-bg-elev' : 'bg-bg-soft/50',
                        )}
                      >
                        <td className="px-5 py-3 font-medium tabular-nums text-ink sm:px-6">
                          {row.date}
                        </td>
                        <td className="px-5 py-3 tabular-nums text-ink-2 sm:px-6">{row.signups}</td>
                        <td className="px-5 py-3 tabular-nums text-ink-2 sm:px-6">{row.quiz}</td>
                        <td className="px-5 py-3 tabular-nums text-ink-2 sm:px-6">{row.exam}</td>
                        <td className="px-5 py-3 tabular-nums text-ink-2 sm:px-6">
                          {row.exercises}
                        </td>
                        <td className="px-5 py-3 font-semibold tabular-nums text-ink sm:px-6">
                          {total}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-ink-3">
                      No daily records to display.
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

export default AdminActivityPage;
