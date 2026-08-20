'use client';

import Link from 'next/link';
import { ArrowRight, ChevronRight, MoreHorizontal, Plus } from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Course } from '@/src/domain/course';
import type { ExamHistoryItem, QuizHistoryItem } from '@/src/domain/assessment';
import { Button } from '@/src/components/ui/button';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Avatar } from '@/src/components/ui/avatar';
import { useMyExams, useMyQuizzes } from '@/src/features/assessments/useAssessments';
import { useTranslation, useIsRtl, useCategoryLabel } from '@/src/i18n';
import { useTheme } from '@/src/providers';
import { cn } from '@/src/lib/utils';
import { learnerCoursePath } from '@/src/features/auth/learnerRoutes';

type ActivityItem =
  | { kind: 'quiz'; item: QuizHistoryItem }
  | { kind: 'exam'; item: ExamHistoryItem };

function useChartPalette() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return {
    grid: isDark ? '#2B3648' : '#E2E8F0',
    tick: isDark ? '#778396' : '#94A3B8',
    progress: isDark ? '#22D3EE' : '#007F8E',
    target: isDark ? '#67E8F9' : '#009DAF',
    bar: isDark ? '#0891B2' : '#007F8E',
    average: isDark ? '#FB923C' : '#F97316',
  };
}

function buildActivity(quizzes: QuizHistoryItem[], exams: ExamHistoryItem[]): ActivityItem[] {
  return [
    ...quizzes.map((item) => ({ kind: 'quiz' as const, item })),
    ...exams.map((item) => ({ kind: 'exam' as const, item })),
  ]
    .sort(
      (a, b) =>
        new Date(b.item.submittedAt).getTime() - new Date(a.item.submittedAt).getTime(),
    )
    .slice(0, 6);
}

function shortId(id: string) {
  return id.length > 10 ? `${id.slice(0, 8)}…` : id;
}

function useLocaleTag(locale: string) {
  if (locale === 'he') return 'he-IL';
  if (locale === 'bn') return 'bn-BD';
  return 'en-US';
}

function useWeekdayShortLabels() {
  const { locale } = useTranslation();
  const formatter = new Intl.DateTimeFormat(useLocaleTag(locale), { weekday: 'short' });
  return Array.from({ length: 7 }, (_, i) => formatter.format(new Date(2024, 0, 1 + i)));
}

function useMonthShortLabels() {
  const { locale } = useTranslation();
  const formatter = new Intl.DateTimeFormat(useLocaleTag(locale), { month: 'short' });
  return Array.from({ length: 12 }, (_, i) => formatter.format(new Date(2024, i, 1)));
}

function useScoreRankLabel() {
  const { t } = useTranslation();
  return (score: number) => {
    if (score >= 90) return t('dashboard.scoreExcellent');
    if (score >= 75) return t('dashboard.scoreStrong');
    if (score >= 60) return t('dashboard.scoreGood');
    return t('dashboard.scoreNeedsReview');
  };
}

function buildCourseProgressData(courses: Course[], labels: string[]) {
  const ready = courses.filter((course) => course.status === 'ready').slice(0, 7);

  return labels.map((name, index) => {
    const course = ready[index % Math.max(ready.length, 1)];
    const progress = course?.progressPercent ?? 0;
    return {
      name,
      progress,
      target: Math.min(100, progress + Math.max(8, Math.round(progress * 0.15))),
    };
  });
}

function buildMonthlyOverview(
  quizzes: QuizHistoryItem[],
  exams: ExamHistoryItem[],
  months: string[],
) {
  const counts = new Array(12).fill(0);
  const scores = new Array(12).fill(0);
  const scoreCounts = new Array(12).fill(0);

  [...quizzes, ...exams].forEach((item) => {
    const month = new Date(item.submittedAt).getMonth();
    counts[month] += 1;
    scores[month] += item.score;
    scoreCounts[month] += 1;
  });

  return months.map((name, index) => ({
    name,
    attempts: counts[index],
    average: scoreCounts[index] ? Math.round(scores[index] / scoreCounts[index]) : 0,
  }));
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-bg-elev px-3 py-2 shadow-card">
      <p className="mb-1 text-xs font-semibold text-ink">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-xs text-ink-2">
          {entry.name}: <span className="font-semibold text-ink">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

function PanelHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-b border-line px-5 py-4 sm:px-6">
      <h3 className="text-base font-bold text-ink sm:text-lg">{title}</h3>
      {description ? <p className="mt-1 text-sm text-ink-2">{description}</p> : null}
    </div>
  );
}

function CourseProgressChart({ courses }: { courses: Course[] }) {
  const { t } = useTranslation();
  const palette = useChartPalette();
  const weekdayLabels = useWeekdayShortLabels();
  const data = buildCourseProgressData(courses, weekdayLabels);

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card">
      <PanelHeader
        title={t('dashboard.chartLearningPerformance')}
        description={t('dashboard.chartLearningPerformanceDesc')}
      />
      <div className="h-[280px] px-2 py-4 sm:px-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: palette.tick }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: palette.tick }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="progress"
              name={t('dashboard.chartProgress')}
              stroke={palette.progress}
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="target"
              name={t('dashboard.chartTarget')}
              stroke={palette.target}
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function LearningOverviewChart({
  quizzes,
  exams,
}: {
  quizzes: QuizHistoryItem[];
  exams: ExamHistoryItem[];
}) {
  const { t } = useTranslation();
  const palette = useChartPalette();
  const monthLabels = useMonthShortLabels();
  const data = buildMonthlyOverview(quizzes, exams, monthLabels);

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card">
      <PanelHeader
        title={t('dashboard.chartLearningOverview')}
        description={t('dashboard.chartLearningOverviewDesc')}
      />
      <div className="h-[280px] px-2 py-4 sm:px-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: palette.tick }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: palette.tick }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: palette.tick }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip content={<ChartTooltip />} />
            <Bar
              yAxisId="left"
              dataKey="attempts"
              name={t('dashboard.chartAttempts')}
              fill={palette.bar}
              radius={[4, 4, 0, 0]}
              barSize={16}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="average"
              name={t('dashboard.chartAverageScore')}
              stroke={palette.average}
              strokeWidth={2.5}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function ChartsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Skeleton className="h-[340px] rounded-2xl" />
      <Skeleton className="h-[340px] rounded-2xl" />
    </div>
  );
}

function TableSkeleton() {
  return <Skeleton className="h-[420px] rounded-2xl" />;
}

export function DashboardChartsRow({ courses }: { courses: Course[] }) {
  const quizzesQ = useMyQuizzes();
  const examsQ = useMyExams();

  if (quizzesQ.isLoading || examsQ.isLoading) return <ChartsSkeleton />;

  const quizzes = quizzesQ.data ?? [];
  const exams = examsQ.data ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <CourseProgressChart courses={courses} />
      <LearningOverviewChart quizzes={quizzes} exams={exams} />
    </div>
  );
}

export function DashboardActivityTable() {
  const { t } = useTranslation();
  const scoreRank = useScoreRankLabel();
  const quizzesQ = useMyQuizzes();
  const examsQ = useMyExams();

  if (quizzesQ.isLoading || examsQ.isLoading) return <TableSkeleton />;

  const activity = buildActivity(quizzesQ.data ?? [], examsQ.data ?? []);

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card">
      <PanelHeader
        title={t('dashboard.recentActivity')}
        description={t('dashboard.analytics')}
      />

      {(quizzesQ.isError || examsQ.isError) && (
        <div className="flex justify-end border-b border-line px-5 py-3 sm:px-6">
          <Button
            variant="soft"
            size="sm"
            className="rounded-full"
            onClick={() => {
              void quizzesQ.refetch();
              void examsQ.refetch();
            }}
          >
            {t('common.retry')}
          </Button>
        </div>
      )}

      {activity.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm leading-6 text-ink-2 sm:px-6">
          {t('dashboard.noActivity')}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-bg-soft text-xs font-medium text-ink-3">
                <th className="px-5 py-3.5 sm:px-6">{t('dashboard.tableAssessment')}</th>
                <th className="px-5 py-3.5 sm:px-6">{t('dashboard.tableId')}</th>
                <th className="px-5 py-3.5 sm:px-6">{t('dashboard.tableType')}</th>
                <th className="px-5 py-3.5 sm:px-6">{t('dashboard.tableScore')}</th>
                <th className="px-5 py-3.5 sm:px-6">{t('dashboard.tableResult')}</th>
                <th className="px-5 py-3.5 sm:px-6">{t('dashboard.tableAction')}</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((entry, index) => {
                const title =
                  entry.kind === 'quiz' ? entry.item.lessonTitle : entry.item.scopeTitle;
                const label =
                  entry.kind === 'quiz' ? t('dashboard.typeQuiz') : t('dashboard.typeExam');
                return (
                  <tr
                    key={`${entry.kind}-${entry.item.id}`}
                    className={cn(
                      'border-b border-line last:border-b-0',
                      index % 2 === 1 && 'bg-bg-soft/40',
                    )}
                  >
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <Avatar name={title} className="size-9 text-xs" />
                        <span className="font-medium text-ink">{title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-ink-3 sm:px-6">
                      {shortId(entry.item.id)}
                    </td>
                    <td className="px-5 py-4 sm:px-6">
                      <span className="rounded-full border border-line bg-bg-soft px-2.5 py-0.5 text-xs font-medium text-ink-2">
                        {label}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold tabular-nums text-ink sm:px-6">
                      {entry.item.score}%
                    </td>
                    <td className="px-5 py-4 text-ink-2 sm:px-6">{scoreRank(entry.item.score)}</td>
                    <td className="px-5 py-4 sm:px-6">
                      <button
                        type="button"
                        className="grid size-8 place-items-center rounded-xl border border-line text-ink-3 transition hover:border-line-2 hover:bg-bg-soft hover:text-primary"
                        aria-label={t('dashboard.moreActions')}
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function CoursePreviewRow({
  course,
  isRtl,
}: {
  course: Course;
  isRtl: boolean;
}) {
  const categoryLabel = useCategoryLabel(course.category);

  return (
    <div className="flex items-center gap-3 border-b border-line px-2 py-4 last:border-b-0 sm:px-3">
      <Avatar name={course.title} className="size-10 text-xs" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink">{course.title}</p>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${course.progressPercent}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-ink-3">
          {categoryLabel} · {course.progressPercent}%
        </p>
      </div>
      <Link
        href={learnerCoursePath(course.id)}
        className="grid size-8 shrink-0 place-items-center rounded-xl border border-line text-ink-3 transition hover:border-primary/30 hover:bg-primary-soft hover:text-primary"
      >
        <ArrowRight className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
      </Link>
    </div>
  );
}

export function RecentCoursesPanel({ courses }: { courses: Course[] }) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const preview = courses.slice(0, 6);

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card">
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <div>
          <h3 className="text-base font-bold text-ink sm:text-lg">{t('dashboard.yourCourses')}</h3>
          <p className="mt-1 text-sm text-ink-2">
            {courses.length === 1
              ? t('dashboard.coursesInLibraryOne')
              : t('dashboard.coursesInLibraryMany', { count: String(courses.length) })}
          </p>
        </div>
        <Link
          href="/create-course"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-ink transition hover:bg-primary-dark"
          aria-label={t('dashboard.createCourse')}
        >
          <Plus className="size-4" />
        </Link>
      </div>

      <div className="flex-1 px-2 sm:px-3">
        {preview.map((course) => (
          <CoursePreviewRow key={course.id} course={course} isRtl={isRtl} />
        ))}
      </div>

      {courses.length > 6 ? (
        <div className="border-t border-line px-5 py-3 sm:px-6">
          <Link
            href="/my-courses"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark"
          >
            {t('dashboard.viewAll')}
            <ChevronRight className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
          </Link>
        </div>
      ) : null}
    </section>
  );
}

export function StudySummaryCard({
  label,
  value,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  iconClass?: string;
}) {
  return (
    <div className="flex items-center gap-4 bg-bg-elev px-5 py-4 sm:px-6">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-bg-soft">
        <Icon className={cn('size-[18px]', iconClass ?? 'text-primary')} strokeWidth={1.75} />
      </span>
      <div>
        <p className="text-xs font-medium text-ink-3">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-ink">{value}</p>
      </div>
    </div>
  );
}
