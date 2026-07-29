'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  Clock,
  Flame,
  GraduationCap,
  Plus,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { TRIAL_PERIOD_MONTHS } from '@/src/constants/pricing';
import { useMe } from '@/src/features/auth';
import { useCourses } from '@/src/features/courses';
import { useMyAchievements } from '@/src/features/gamification';
import { useSubscription } from '@/src/features/subscription';
import { useTranslation } from '@/src/i18n';
import type { MessageKey } from '@/src/i18n';
import type { Course } from '@/src/domain/course';
import { getUserDisplayName } from '@/src/lib/userDisplay';
import { Button } from '@/src/components/ui/button';
import { Skeleton } from '@/src/components/ui/skeleton';
import {
  DashboardActivityTable,
  DashboardChartsRow,
  RecentCoursesPanel,
  StudySummaryCard,
} from './DashboardAnalytics';

function greetingKey(): MessageKey {
  const hour = new Date().getHours();
  if (hour < 12) return 'dashboard.greetingMorning';
  if (hour < 17) return 'dashboard.greetingAfternoon';
  return 'dashboard.greetingEvening';
}

function computeCourseStats(courses: Course[]) {
  const ready = courses.filter((course) => course.status === 'ready');
  const completed = ready.filter((course) => course.progressPercent >= 100).length;
  const inProgress = ready.filter(
    (course) => course.progressPercent > 0 && course.progressPercent < 100,
  ).length;
  const avgProgress = ready.length
    ? Math.round(ready.reduce((sum, course) => sum + course.progressPercent, 0) / ready.length)
    : 0;
  return { ready: ready.length, completed, inProgress, avgProgress };
}

function DashboardHeader({ name }: { name: string }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-ink-2">{t(greetingKey())}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{name}</h1>
        <p className="mt-2 text-sm leading-7 text-ink-2 sm:text-base">{t('dashboard.subtitle')}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/create-course">
          <Button size="lg" className="rounded-full px-5">
            <Plus className="size-4" />
            {t('common.newCourse')}
          </Button>
        </Link>
        <Link href="/assessments">
          <Button size="lg" variant="soft" className="rounded-full px-5">
            <ClipboardList className="size-4" />
            {t('nav.assessments')}
          </Button>
        </Link>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8 xl:px-10">
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-none bg-bg-elev" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[360px] rounded-2xl" />
        <Skeleton className="h-[360px] rounded-2xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <Skeleton className="h-[420px] rounded-2xl lg:col-span-4" />
        <Skeleton className="h-[420px] rounded-2xl lg:col-span-8" />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const meQ = useMe();
  const coursesQ = useCourses();
  const achievementsQ = useMyAchievements();
  const subscriptionQ = useSubscription();

  const loading =
    meQ.isLoading || coursesQ.isLoading || achievementsQ.isLoading || subscriptionQ.isLoading;

  if (loading) return <DashboardSkeleton />;

  const user = meQ.data?.user;
  const displayName = getUserDisplayName(user);
  const courses = coursesQ.data?.courses ?? [];
  const achievements = achievementsQ.data;
  const tier = subscriptionQ.data?.subscription.tier ?? user?.tier ?? 'free';
  const subscription = subscriptionQ.data?.subscription;
  const isPremium = tier === 'premium';
  const streak = user?.streak?.current ?? 0;
  const courseStats = computeCourseStats(courses);

  const shellClass = 'w-full space-y-6 p-4 sm:p-6 lg:p-8 xl:px-10';

  if (coursesQ.isError || !user) {
    return (
      <div className={shellClass}>
        <DashboardHeader name={displayName} />
        <div className="rounded-2xl border border-line bg-bg-elev p-10 text-center shadow-card">
          <p className="text-ink-2">{t('dashboard.loadError')}</p>
          <Button variant="soft" className="mt-4 rounded-full px-5" onClick={() => coursesQ.refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className={shellClass}>
        <DashboardHeader name={displayName} />

        <div className="rounded-2xl border border-line bg-bg-elev p-10 text-center shadow-card sm:p-12">
          <div className="mx-auto grid size-14 place-items-center rounded-full border border-line bg-bg-soft text-primary">
            <Sparkles className="size-7" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-ink sm:text-2xl">{t('dashboard.createFirstTitle')}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-ink-2">
            {t('dashboard.createFirstBody')}
          </p>
          <Link href="/create-course" className="mt-6 inline-block">
            <Button size="lg" className="rounded-full px-6">
              <Plus className="size-4" />
              {t('dashboard.startLearning')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <DashboardHeader name={displayName} />

      {!isPremium && subscription?.requiresPayment ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-bad/20 bg-bg-elev px-5 py-4 shadow-card sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="font-semibold text-ink">{t('dashboard.trialEndedTitle')}</p>
            <p className="mt-1 text-sm leading-6 text-ink-2">{t('dashboard.trialEndedBody')}</p>
          </div>
          <Link href="/upgrade" className="shrink-0">
            <Button className="rounded-full px-5">{t('dashboard.subscribeNow')}</Button>
          </Link>
        </div>
      ) : null}

      {!isPremium && subscription?.trialActive ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-bg-elev px-5 py-4 shadow-card sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary-soft text-primary">
              <Clock className="size-5" />
            </span>
            <div>
              <p className="font-semibold text-ink">
                {t('dashboard.trialDaysLeft', {
                  days: String(subscription.daysRemainingInTrial),
                  months: String(TRIAL_PERIOD_MONTHS),
                })}
              </p>
              <p className="mt-1 text-sm leading-6 text-ink-2">{t('dashboard.trialPremiumNote')}</p>
            </div>
          </div>
          <Link href="/upgrade" className="shrink-0">
            <Button variant="soft" className="rounded-full px-5">
              {t('dashboard.viewPlans')}
            </Button>
          </Link>
        </div>
      ) : null}

      <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
        <StudySummaryCard
          label="Courses"
          value={String(courseStats.ready)}
          icon={GraduationCap}
          iconClass="text-primary"
        />
        <StudySummaryCard
          label="Progress"
          value={`${courseStats.avgProgress}%`}
          icon={Target}
          iconClass="text-secondary"
        />
        <StudySummaryCard
          label="Achievements"
          value={`${achievements?.earnedCount ?? 0}`}
          icon={Trophy}
          iconClass="text-good"
        />
        <StudySummaryCard
          label="Streak"
          value={String(streak)}
          icon={Flame}
          iconClass="text-primary"
        />
      </div>

      <DashboardChartsRow courses={courses} />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <RecentCoursesPanel courses={courses} />
        </div>
        <div className="lg:col-span-8">
          <DashboardActivityTable />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-bg-soft shadow-card">
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-sm font-medium text-ink">
              <BookOpen className="size-4 text-primary" />
              {t('dashboard.continueLearning')}
            </div>
            <p className="mt-2 text-sm leading-6 text-ink-2">
              {courseStats.inProgress > 0
                ? `${courseStats.inProgress} course${courseStats.inProgress === 1 ? '' : 's'} in progress. Pick up where you left off.`
                : t('dashboard.welcomeHub')}
            </p>
          </div>
          <Link href="/my-courses" className="shrink-0">
            <Button variant="soft" className="rounded-full px-5">
              {t('dashboard.yourCourses')}
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
