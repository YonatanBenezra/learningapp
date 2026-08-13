'use client';

import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  Brain,
  ClipboardList,
  Crown,
  DollarSign,
  Flag,
  Server,
  Shield,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTranslation } from '@/src/i18n';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { AdminMetricCard, AdminMetricsDashboardSkeleton, AdminPanel, formatUsd, pct } from './AdminUi';
import {
  useAdminActivity,
  useAdminAssessmentsDashboard,
  useAdminMarketplace,
  useAdminMetrics,
  useAdminSubscriptions,
  useAdminSystem,
} from './useAdmin';

const TIER_COLORS = ['#64748B', '#007F8E', '#F97316'];

const CHART_TOOLTIP = {
  contentStyle: {
    borderRadius: 8,
    border: '1px solid var(--line)',
    background: 'var(--bg-elev)',
    color: 'var(--ink)',
  },
  labelStyle: { color: 'var(--ink-2)' },
  itemStyle: { color: 'var(--ink)' },
};

const BAR_CURSOR = { fill: 'var(--bg-soft)', opacity: 0.45 };

function AlertChip({
  href,
  label,
  tone,
}: {
  href: string;
  label: string;
  tone: 'warn' | 'bad';
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors',
        tone === 'bad'
          ? 'border-bad/25 bg-bad-soft text-bad hover:border-bad/40'
          : 'border-warn/25 bg-warn-soft text-warn hover:border-warn/40',
      )}
    >
      <AlertTriangle className="size-4 shrink-0" />
      {label}
      <ArrowRight className="size-3.5 opacity-70" />
    </Link>
  );
}

const QUICK_LINK_KEYS = [
  { href: '/admin/users', key: 'navUsers' as const, icon: Users },
  { href: '/admin/subscriptions', key: 'navSubscriptions' as const, icon: Crown },
  { href: '/admin/assessments', key: 'navAssessments' as const, icon: ClipboardList },
  { href: '/admin/marketplace', key: 'navMarketplace' as const, icon: Store },
  { href: '/admin/content', key: 'navModeration' as const, icon: Shield },
  { href: '/admin/flags', key: 'navFlags' as const, icon: Flag },
  { href: '/admin/costs', key: 'navAiCosts' as const, icon: DollarSign },
  { href: '/admin/system', key: 'navSystem' as const, icon: Server },
  { href: '/admin/notifications', key: 'navNotifications' as const, icon: Bell },
  { href: '/admin/activity', key: 'navActivity' as const, icon: TrendingUp },
] as const;

export function AdminMetricsPage() {
  const { t } = useTranslation();
  const metricsQ = useAdminMetrics();
  const activityQ = useAdminActivity();
  const systemQ = useAdminSystem();
  const subsQ = useAdminSubscriptions();
  const marketplaceQ = useAdminMarketplace();
  const assessmentsQ = useAdminAssessmentsDashboard();

  const isLoading = metricsQ.isLoading;
  const isError = metricsQ.isError || !metricsQ.data;

  if (isLoading) {
    return <AdminMetricsDashboardSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex w-full items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg rounded-lg border border-line bg-bg-elev p-10 text-center shadow-card">
          <p className="text-ink-2">{t('admin.accessDenied')}</p>
          <Button variant="soft" className="mt-4 rounded-lg" onClick={() => metricsQ.refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  const data = metricsQ.data;
  const activity = activityQ.data;
  const system = systemQ.data;
  const subs = subsQ.data;
  const marketplace = marketplaceQ.data;
  const assessments = assessmentsQ.data;

  const tierChart = subs
    ? [
        { name: t('adminCommon.tierFree'), value: subs.usersByTier.free },
        { name: t('adminCommon.tierStandard'), value: subs.usersByTier.standard },
        { name: t('adminCommon.tierPremium'), value: subs.usersByTier.premium },
      ]
    : [];

  const courseStatusChart = Object.entries(data.courses.byStatus).map(([status, count]) => ({
    status,
    count,
  }));

  const alerts = [
    system && system.openFlags > 0
      ? { href: '/admin/flags', label: `${system.openFlags} open moderation flags`, tone: 'warn' as const }
      : null,
    system && system.failedCourses > 0
      ? { href: '/admin/system', label: `${system.failedCourses} failed course generations`, tone: 'bad' as const }
      : null,
    system && system.failedAssessments > 0
      ? {
          href: '/admin/assessments',
          label: `${system.failedAssessments} failed skill assessments`,
          tone: 'bad' as const,
        }
      : null,
    system &&
    !system.queues.courseGeneration.unavailable &&
    system.queues.courseGeneration.waiting > 0
      ? {
          href: '/admin/system',
          label: `${system.queues.courseGeneration.waiting} courses queued`,
          tone: 'warn' as const,
        }
      : null,
    subs && subs.trialsExpiringSoon > 0
      ? {
          href: '/admin/subscriptions',
          label: `${subs.trialsExpiringSoon} trials expiring within 7 days`,
          tone: 'warn' as const,
        }
      : null,
  ].filter(Boolean) as { href: string; label: string; tone: 'warn' | 'bad' }[];

  return (
    <div className="w-full bg-bg-soft/40">
      <div className="w-full space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Alerts */}
        {alerts.length > 0 ? (
          <div className="rounded-lg border border-line bg-bg-elev p-4 shadow-card">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
              Requires attention
            </p>
            <div className="flex flex-wrap gap-2">
              {alerts.map((alert) => (
                <AlertChip key={alert.label} {...alert} />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-good/20 bg-good-soft/50 px-4 py-3 text-sm text-good">
            All monitored systems are within normal operating thresholds.
          </div>
        )}

        {/* KPI grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminMetricCard
            label={t('adminCommon.metricsActiveUsers')}
            value={data.users.active.toLocaleString()}
            hint={`${data.users.premium} premium · ${data.users.total} total accounts`}
            icon={Users}
            accent="primary"
          />
          <AdminMetricCard
            label={t('adminCommon.metricsNewSignups')}
            value={(activity?.signups7d ?? 0).toLocaleString()}
            hint={`${activity?.signups30d ?? 0} in the last 30 days`}
            icon={TrendingUp}
            accent="good"
          />
          <AdminMetricCard
            label={t('adminCommon.metricsCoursePipeline')}
            value={data.courses.total.toLocaleString()}
            hint={`Success ${pct(data.courses.generationSuccessRate)} · Failed ${pct(data.courses.generationFailureRate)}`}
            icon={BookOpen}
            accent="primary"
          />
          <AdminMetricCard
            label={t('adminCommon.metricsRevenue')}
            value={marketplace ? formatUsd(marketplace.totalRevenueCents) : '—'}
            hint={
              marketplace
                ? `${marketplace.totalEnrollments} enrollments · ${marketplace.publishedCourses} published`
                : undefined
            }
            icon={Store}
            accent="secondary"
          />
          <AdminMetricCard
            label={t('adminCommon.metricsAssessmentsLabel')}
            value={(assessments?.totalAssessments ?? 0).toLocaleString()}
            hint={`${assessments?.completedSubmissions ?? 0} completed submissions`}
            icon={ClipboardList}
            accent="primary"
          />
          <AdminMetricCard
            label={t('adminCommon.activityLearning')}
            value={(
              data.assessments.quizSubmissions + data.assessments.examSubmissions
            ).toLocaleString()}
            hint={`${data.assessments.quizSubmissions} quizzes · ${data.assessments.examSubmissions} exams`}
            icon={Activity}
            accent="good"
          />
          <AdminMetricCard
            label={t('adminCommon.metricsPaidMembersLabel')}
            value={(subs?.paidActiveSubscriptions ?? 0).toLocaleString()}
            hint={
              subs
                ? `${subs.usersByTier.standard} standard · ${subs.usersByTier.premium} premium`
                : undefined
            }
            icon={Crown}
            accent="secondary"
          />
          <AdminMetricCard
            label="AI spend"
            value={`$${data.ai.totalCostUsd.toFixed(2)}`}
            hint={`${data.ai.totalCalls.toLocaleString()} API calls · view breakdown in AI costs`}
            icon={Brain}
            accent="warn"
          />
        </div>

        {/* Charts */}
        <div className="grid gap-4 xl:grid-cols-12">
          <AdminPanel
            title={t('adminCommon.activitySignups')}
            description={t('adminCommon.activityDailyActivity')}
            className="xl:col-span-7"
          >
            <div className="h-72">
              {activity?.signupsByDay.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activity.signupsByDay}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--ink-3)' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--ink-3)' }} />
                    <Tooltip {...CHART_TOOLTIP} cursor={BAR_CURSOR} />
                    <Bar
                      dataKey="count"
                      fill="#007F8E"
                      radius={[6, 6, 0, 0]}
                      activeBar={{ fill: '#009DAF' }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-ink-3">
                  {t('adminCommon.noSignupData')}
                </div>
              )}
            </div>
          </AdminPanel>

          <AdminPanel
            title={t('adminCommon.metricsMembershipTiers')}
            description={t('adminCommon.metricsMembershipTiersDesc')}
            className="xl:col-span-5"
          >
            <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
              <div className="h-52">
                {tierChart.some((item) => item.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tierChart}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={78}
                        paddingAngle={2}
                      >
                        {tierChart.map((_, index) => (
                          <Cell key={index} fill={TIER_COLORS[index % TIER_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip {...CHART_TOOLTIP} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-ink-3">
                    {t('adminCommon.noTierData')}
                  </div>
                )}
              </div>
              <dl className="space-y-3">
                {tierChart.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <dt className="flex items-center gap-2 text-ink-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ background: TIER_COLORS[index] }}
                      />
                      {item.name}
                    </dt>
                    <dd className="font-semibold text-ink">{item.value.toLocaleString()}</dd>
                  </div>
                ))}
                {subs ? (
                  <div className="border-t border-line pt-3 text-sm text-ink-3">
                    {t('adminCommon.trialsExpiringSoon', { count: String(subs.trialsExpiringSoon) })}
                  </div>
                ) : null}
              </dl>
            </div>
          </AdminPanel>
        </div>

        {/* Breakdown row */}
        <div className="grid gap-4 lg:grid-cols-3">
          <AdminPanel title={t('adminCommon.metricsCoursePipeline')} description={t('adminCommon.metricsCoursePipelineDesc')}>
            <div className="h-48">
              {courseStatusChart.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseStatusChart} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--line)" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="status"
                      width={88}
                      tick={{ fontSize: 11, fill: 'var(--ink-2)' }}
                    />
                    <Tooltip {...CHART_TOOLTIP} cursor={BAR_CURSOR} />
                    <Bar
                      dataKey="count"
                      fill="#009DAF"
                      radius={[0, 6, 6, 0]}
                      activeBar={{ fill: '#007F8E' }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-ink-3">{t('adminCommon.noRecords')}</p>
              )}
            </div>
          </AdminPanel>

          <AdminPanel title={t('adminCommon.metricsAssessments')} description={t('adminCommon.metricsAssessmentsDesc')}>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-ink-2">{t('adminCommon.metricsSkillAssessments')}</dt>
                <dd className="font-semibold text-ink">
                  {assessments?.totalAssessments ?? '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-2">{t('adminCommon.metricsAssessmentSubmissions')}</dt>
                <dd className="font-semibold text-ink">
                  {assessments?.completedSubmissions ?? '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-2">{t('adminCommon.metricsExerciseSubmissions')}</dt>
                <dd className="font-semibold text-ink">{data.exercises.submissions}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-2">{t('adminCommon.metricsGradedExercises')}</dt>
                <dd className="font-semibold text-ink">{data.exercises.graded}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-3">
                <dt className="text-ink-2">{t('adminCommon.metricsExerciseCompletion')}</dt>
                <dd className="font-semibold text-primary">{pct(data.exercises.completionRate)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-2">{t('adminCommon.metricsLessonsCompleted')}</dt>
                <dd className="font-semibold text-ink">
                  {activity?.lessonCompletions.toLocaleString() ?? '—'}
                </dd>
              </div>
            </dl>
          </AdminPanel>

          <AdminPanel title={t('adminCommon.metricsOperations')} description={t('adminCommon.metricsOperationsDesc')}>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-ink-2">{t('adminCommon.metricsOpenFlags')}</dt>
                <dd className="font-semibold text-ink">{system?.openFlags ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-2">{t('adminCommon.metricsGeneratingCourses')}</dt>
                <dd className="font-semibold text-ink">{system?.generatingCourses ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-2">{t('adminCommon.metricsCourseQueueWaiting')}</dt>
                <dd className="font-semibold text-ink">
                  {system?.queues.courseGeneration.unavailable
                    ? t('adminCommon.unavailable')
                    : system?.queues.courseGeneration.waiting ?? '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-2">{t('adminCommon.metricsAssessmentQueueWaiting')}</dt>
                <dd className="font-semibold text-ink">
                  {system?.queues.skillAssessmentGeneration.unavailable
                    ? t('adminCommon.unavailable')
                    : system?.queues.skillAssessmentGeneration.waiting ?? '—'}
                </dd>
              </div>
              <div className="border-t border-line pt-3 text-sm leading-relaxed text-ink-3">
                {data.labs.note}
              </div>
            </dl>
          </AdminPanel>
        </div>

        {/* Quick links */}
        <AdminPanel title={t('adminCommon.metricsAdminSections')} description={t('adminCommon.metricsAdminSectionsDesc')}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {QUICK_LINK_KEYS.map(({ href, key, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 rounded-lg border border-line bg-bg-soft px-4 py-3.5 text-sm font-medium text-ink transition-colors hover:border-primary/30 hover:bg-bg-elev"
              >
                <span className="grid size-9 place-items-center rounded-lg border border-line bg-bg-elev text-primary transition-colors group-hover:border-primary/20 group-hover:bg-primary-soft">
                  <Icon className="size-4" />
                </span>
                <span className="flex-1">{t(`adminCommon.${key}`)}</span>
                <ArrowRight className="size-4 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}

export default AdminMetricsPage;
