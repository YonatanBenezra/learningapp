'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Plus,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Container } from '@/src/components/marketing/Container';
import {
  isAssessmentQuotaExhausted,
  tierPlanLabel,
} from '@/src/constants/tierLimits';
import { cn } from '@/src/lib/utils';
import type { SkillAssessmentQuota, SkillAssessmentSummary } from '@/src/domain/assessment';
import { AssessmentsListSkeleton } from '@/src/features/skill-assessment/SkillAssessmentSkeletons';
import { useMySkillAssessments } from '@/src/features/skill-assessment/useSkillAssessment';
import { useTranslation, useLocaleDateFormatter, useIsRtl } from '@/src/i18n';

function QuotaBadge({ quota }: { quota: SkillAssessmentQuota }) {
  const { t } = useTranslation();
  const tierLabel = tierPlanLabel(quota.tier);
  if (quota.limit === null) {
    return (
      <div className="rounded-lg border border-line bg-bg-soft px-4 py-3 text-sm text-ink-2">
        <span className="font-semibold text-ink">{tierLabel}</span>
        <span className="mx-2 text-ink-3">·</span>
        <span>
          {t('marketing.assessmentsUsed', { used: String(quota.used) })} ·{' '}
          {t('marketing.unlimitedPlan')}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-bg-soft px-4 py-3 text-sm text-ink-2">
      <span className="font-semibold text-ink">{tierLabel}</span>
      <span className="mx-2 text-ink-3">·</span>
      <span>
        {t('marketing.assessmentsUsedOf', {
          used: String(quota.used),
          limit: String(quota.limit),
        })}
      </span>
    </div>
  );
}

function AssessmentLimitNotice({ quota }: { quota: SkillAssessmentQuota }) {
  const { t } = useTranslation();
  const tierLabel = tierPlanLabel(quota.tier);
  const limit = quota.limit ?? 0;
  const body = t('marketing.assessmentLimitBody', {
    tier: tierLabel,
    limit: String(limit),
  });
  const upgrade = t('marketing.upgradePlan');
  const [before, after] = body.includes(upgrade)
    ? [body.slice(0, body.indexOf(upgrade)), body.slice(body.indexOf(upgrade) + upgrade.length)]
    : [body, ''];

  return (
    <div
      role="alert"
      className="rounded-lg border border-bad/35 bg-bad-soft px-4 py-3 text-sm text-bad"
    >
      <p className="font-semibold">{t('marketing.assessmentLimitReached')}</p>
      <p className="mt-1 leading-6 text-bad/95">
        {before}
        <Link href="/upgrade" className="font-semibold underline underline-offset-2">
          {upgrade}
        </Link>
        {after}
      </p>
    </div>
  );
}

function CreateAssessmentButton({
  atLimit,
  className,
  size = 'lg',
  label,
}: {
  atLimit: boolean;
  className?: string;
  size?: 'lg' | 'md';
  label: string;
}) {
  if (atLimit) {
    return (
      <span className={cn('inline-flex', className)}>
        <Button
          size={size}
          className="rounded-full bg-primary hover:bg-primary-dark"
          disabled
        >
          <Plus className="size-4" />
          {label}
        </Button>
      </span>
    );
  }

  return (
    <Link href="/assessment/start" className={cn('inline-flex', className)}>
      <Button size={size} className="rounded-full bg-primary hover:bg-primary-dark">
        <Plus className="size-4" />
        {label}
      </Button>
    </Link>
  );
}

function AssessmentCard({ item }: { item: SkillAssessmentSummary }) {
  const { t } = useTranslation();
  const formatDate = useLocaleDateFormatter();
  const isRtl = useIsRtl();
  const completed = item.status === 'completed';
  const generating = item.generationStatus === 'generating';
  const failed = item.generationStatus === 'failed';

  return (
    <article className="rounded-lg border border-line bg-bg-elev p-6 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">
            {item.topic}
          </p>
          <h3 className="mt-2 text-xl font-bold text-ink">{item.topicLabel}</h3>
        </div>
        <span
          className={cn(
            'rounded-lg px-3 py-1 text-xs font-semibold',
            completed && 'bg-good-soft text-good',
            !completed && generating && 'bg-warn-soft text-warn',
            !completed && failed && 'bg-bad-soft text-bad',
            !completed && !generating && !failed && 'bg-primary-soft text-primary',
          )}
        >
          {completed
            ? t('marketing.statusCompleted')
            : generating
              ? t('marketing.statusGenerating')
              : failed
                ? t('marketing.statusFailed')
                : t('marketing.statusInProgress')}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-sm text-ink-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1">
          <ClipboardList className="size-4 text-primary" />
          {t('marketing.questionsCount', { count: String(item.questionCount) })}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1">
          <CalendarDays className="size-4 text-primary" />
          {formatDate(item.generatedAt)}
        </span>
        {completed && item.submission && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-secondary/20 bg-secondary-soft px-3 py-1 font-medium text-secondary">
            <Trophy className="size-4" />
            {item.submission.level} · {item.submission.score}%
          </span>
        )}
      </div>

      <div className="mt-6">
        {completed ? (
          <Link href={`/assessment/${item.id}/result`} className="inline-flex w-full sm:w-auto">
            <Button variant="soft" className="w-full rounded-lg sm:w-auto">
              {t('marketing.viewResults')}
              <ArrowRight className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
            </Button>
          </Link>
        ) : failed ? (
          <p className="text-sm text-ink-2">
            {item.failureReason ?? t('marketing.generationFailed')}
          </p>
        ) : (
          <Link href={`/assessment/${item.id}`} className="inline-flex w-full sm:w-auto">
            <Button className="w-full rounded-lg bg-primary hover:bg-primary-dark sm:w-auto">
              {generating ? t('marketing.viewProgress') : t('marketing.continueAssessment')}
              <ArrowRight className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
            </Button>
          </Link>
        )}
      </div>
    </article>
  );
}

export function AssessmentsPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useMySkillAssessments();

  const quota = data?.quota;
  const assessments = data?.assessments ?? [];
  const atLimit = isAssessmentQuotaExhausted(quota);

  if (isLoading) {
    return <AssessmentsListSkeleton />;
  }

  return (
    <>
      <div className="pb-16 pt-8 lg:pt-12">
        <Container>
          <div className="overflow-hidden rounded-lg border border-line bg-bg-elev shadow-soft">
            <div className="border-b border-line px-6 py-6 sm:px-8 sm:py-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div data-tour="tour-assessments-header">
                  <div className="inline-flex items-center gap-2 rounded-lg border border-primary/15 bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                    <Sparkles className="size-3.5" />
                    {t('marketing.skillAssessmentsBadge')}
                  </div>
                  <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                    {t('marketing.yourAssessments')}
                  </h1>
                  <p className="mt-2 max-w-2xl text-base text-ink-2">
                    {t('marketing.assessmentsIntro')}
                  </p>
                </div>

                <div
                  className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center"
                  data-tour="tour-assessments-create"
                >
                  {quota ? <QuotaBadge quota={quota} /> : null}
                  <CreateAssessmentButton
                    atLimit={atLimit}
                    label={t('marketing.createAssessment')}
                  />
                </div>
              </div>

              {atLimit && quota ? (
                <div className="mt-6">
                  <AssessmentLimitNotice quota={quota} />
                </div>
              ) : null}
            </div>
          </div>

          {isError ? (
            <div className="mt-8 rounded-lg border border-line bg-bg-elev p-10 text-center shadow-soft">
              <p className="text-lg font-semibold text-ink">{t('marketing.loadAssessmentsError')}</p>
              <p className="mt-2 text-sm text-ink-2">{t('marketing.loadAssessmentsErrorHint')}</p>
              <Button variant="soft" className="mt-4 rounded-lg" onClick={() => refetch()}>
                {t('marketing.tryAgain')}
              </Button>
            </div>
          ) : assessments.length === 0 ? (
            <div className="mt-8 rounded-lg border border-dashed border-line bg-bg-elev p-12 text-center shadow-soft">
              <div className="mx-auto grid size-16 place-items-center rounded-lg bg-primary-soft text-primary">
                <ClipboardList className="size-8" />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-ink">{t('marketing.noAssessmentsYet')}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">
                {t('marketing.noAssessmentsHint')}
              </p>
              <div className="mt-6 flex flex-col items-center gap-4">
                <CreateAssessmentButton
                  atLimit={atLimit}
                  label={t('marketing.createFirstAssessment')}
                />
              </div>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {assessments.map((item) => (
                <AssessmentCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </Container>
      </div>
    </>
  );
}

export default AssessmentsPage;
