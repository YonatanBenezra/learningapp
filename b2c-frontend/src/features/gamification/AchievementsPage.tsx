'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Award, Flame, Lock, Trophy } from 'lucide-react';
import { useMe } from '@/src/features/auth';
import { useTranslation } from '@/src/i18n';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Skeleton } from '@/src/components/ui/skeleton';
import { cn } from '@/src/lib/utils';
import { useAchievementCatalog, useMyAchievements } from './useGamification';

type FilterTab = 'all' | 'earned' | 'locked';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function AchievementsSkeleton() {
  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8 xl:px-10">
      <div className="space-y-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-72" />
        <Skeleton className="mt-4 h-1.5 w-full max-w-md rounded-full" />
      </div>
      <Skeleton className="h-10 w-full max-w-sm" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

const filterTabs: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'earned', label: 'Earned' },
  { id: 'locked', label: 'Locked' },
];

export function AchievementsPage() {
  const { t } = useTranslation();
  const meQ = useMe();
  const catalogQ = useAchievementCatalog();
  const earnedQ = useMyAchievements();
  const [filter, setFilter] = useState<FilterTab>('all');

  const earnedByKey = useMemo(
    () => new Map((earnedQ.data?.achievements ?? []).map((item) => [item.key, item])),
    [earnedQ.data?.achievements],
  );

  const catalog = catalogQ.data?.achievements ?? [];

  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      const unlocked = earnedByKey.has(item.key);
      if (filter === 'earned') return unlocked;
      if (filter === 'locked') return !unlocked;
      return true;
    });
  }, [catalog, earnedByKey, filter]);

  const loading = meQ.isLoading || catalogQ.isLoading || earnedQ.isLoading;
  if (loading) return <AchievementsSkeleton />;

  const shellClass = 'w-full space-y-6 p-4 sm:p-6 lg:p-8 xl:px-10';
  const earnedCount = earnedQ.data?.earnedCount ?? 0;
  const totalCount = earnedQ.data?.total ?? catalog.length;
  const streak = meQ.data?.user.streak?.current ?? 0;
  const progressPercent = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  if (catalogQ.isError || earnedQ.isError) {
    return (
      <div className={shellClass}>
        <PageHeader
          earnedCount={0}
          totalCount={0}
          streak={0}
          progressPercent={0}
          title={t('achievements.title')}
          unlockedLabel={t('achievements.unlocked')}
        />
        <div className="rounded-2xl border border-line bg-bg-elev p-10 text-center shadow-card">
          <p className="text-ink-2">{t('achievements.loadError')}</p>
          <Button
            variant="soft"
            className="mt-4 rounded-full px-5"
            onClick={() => {
              void catalogQ.refetch();
              void earnedQ.refetch();
            }}
          >
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <PageHeader
        earnedCount={earnedCount}
        totalCount={totalCount}
        streak={streak}
        progressPercent={progressPercent}
        title={t('achievements.title')}
        unlockedLabel={t('achievements.unlocked')}
      />

      <div
        className="flex gap-1 overflow-x-auto pb-1 sm:gap-2"
        role="tablist"
        aria-label="Filter achievements"
      >
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={filter === tab.id}
            onClick={() => setFilter(tab.id)}
            className={cn(
              'shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition',
              filter === tab.id
                ? 'bg-primary-soft text-primary'
                : 'text-ink-2 hover:bg-bg-soft hover:text-ink',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredCatalog.length === 0 ? (
        <div className="rounded-2xl border border-line bg-bg-elev p-10 text-center shadow-card">
          <Award className="mx-auto size-8 text-ink-3" />
          <p className="mt-4 text-sm leading-6 text-ink-2">
            {filter === 'earned'
              ? 'No badges earned yet. Complete lessons and quizzes to unlock achievements.'
              : filter === 'locked'
                ? 'All available badges have been earned.'
                : t('achievements.emptyHint')}
          </p>
          {earnedCount === 0 ? (
            <Link href="/my-courses" className="mt-5 inline-block">
              <Button className="rounded-full px-5">{t('achievements.startLearning')}</Button>
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCatalog.map((item) => {
            const earned = earnedByKey.get(item.key);
            const unlocked = Boolean(earned);
            return (
              <article
                key={item.key}
                className={cn(
                  'rounded-2xl border bg-bg-elev p-5 shadow-card transition-colors',
                  unlocked ? 'border-good/25' : 'border-line',
                )}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={cn(
                      'grid size-12 shrink-0 place-items-center rounded-xl border text-2xl',
                      unlocked
                        ? 'border-good/20 bg-good-soft/40'
                        : 'border-line bg-bg-soft opacity-70',
                    )}
                  >
                    {item.icon ?? '🏆'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-ink">{item.title}</h2>
                      {unlocked ? (
                        <Badge variant="good">{t('achievements.earned')}</Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <Lock className="size-3" />
                          {t('achievements.locked')}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ink-2">
                      {item.description ?? t('achievements.defaultDescription')}
                    </p>
                    {earned?.earnedAt ? (
                      <p className="mt-3 text-xs text-ink-3">
                        Unlocked {formatDate(earned.earnedAt)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {earnedCount === 0 && filteredCatalog.length > 0 ? (
        <div className="rounded-2xl border border-line bg-bg-soft px-6 py-5 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <p className="text-sm leading-6 text-ink-2">{t('achievements.emptyHint')}</p>
          <Link href="/my-courses" className="mt-4 inline-block shrink-0 sm:mt-0">
            <Button variant="soft" className="rounded-full px-5">
              {t('achievements.startLearning')}
            </Button>
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function PageHeader({
  title,
  unlockedLabel,
  earnedCount,
  totalCount,
  streak,
  progressPercent,
}: {
  title: string;
  unlockedLabel: string;
  earnedCount: number;
  totalCount: number;
  streak: number;
  progressPercent: number;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm leading-7 text-ink-2 sm:text-base">
          {earnedCount} of {totalCount} {unlockedLabel}
        </p>
        {totalCount > 0 ? (
          <div className="mt-4 max-w-md">
            <div className="mb-1.5 flex items-center justify-between text-xs text-ink-3">
              <span>Overall progress</span>
              <span className="tabular-nums text-ink-2">{progressPercent}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
      {streak > 0 ? (
        <Badge variant="warn" className="gap-1.5 self-start px-3 py-1.5 text-sm">
          <Flame className="size-4" />
          {streak}-day streak
        </Badge>
      ) : (
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-bg-soft text-primary">
          <Trophy className="size-5" />
        </span>
      )}
    </div>
  );
}

export default AchievementsPage;
