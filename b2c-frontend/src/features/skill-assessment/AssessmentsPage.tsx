'use client';

import Link from 'next/link';
import { ClipboardList, Plus } from 'lucide-react';
import { Container } from '@/src/components/marketing/Container';
import { Progress } from '@/src/components/ui/progress';
import { buttonClasses } from '@/src/components/ui/button';
import {
  isAssessmentQuotaExhausted,
  tierPlanLabel,
} from '@/src/constants/tierLimits';
import { cn } from '@/src/lib/utils';
import type { SkillAssessmentQuota, SkillAssessmentSummary } from '@/src/domain/assessment';
import { AssessmentsListSkeleton } from '@/src/features/skill-assessment/SkillAssessmentSkeletons';
import { useMySkillAssessments } from '@/src/features/skill-assessment/useSkillAssessment';
import { AI_CATEGORY_OPTIONS } from '@/src/constants/aiCategories';
import {
  useTranslation,
  useLocaleDateFormatter,
  useSkillLevelCopy,
} from '@/src/i18n';

function QuotaLine({ quota }: { quota: SkillAssessmentQuota }) {
  const { t } = useTranslation();
  const tierLabel = tierPlanLabel(quota.tier);
  const usage =
    quota.limit === null
      ? `${t('marketing.assessmentsUsed', { used: String(quota.used) })} · ${t('marketing.unlimitedPlan')}`
      : t('marketing.assessmentsUsedOf', {
          used: String(quota.used),
          limit: String(quota.limit),
        });

  return (
    <p className="text-sm leading-none text-ink/55">
      <span className="font-medium text-ink/80">{tierLabel}</span>
      <span className="mx-2 text-ink/30">·</span>
      {usage}
    </p>
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
    <div role="alert" className="rounded-md border border-bad/30 bg-bad-soft px-4 py-3 text-sm text-bad">
      <p className="font-medium">{t('marketing.assessmentLimitReached')}</p>
      <p className="mt-1 leading-6 text-bad/90">
        {before}
        <Link href="/upgrade" className="font-medium underline underline-offset-2">
          {upgrade}
        </Link>
        {after}
      </p>
    </div>
  );
}

function CreateAssessmentButton({
  atLimit,
  label,
  className,
}: {
  atLimit: boolean;
  label: string;
  className?: string;
}) {
  const classes = buttonClasses({
    size: 'lg',
    className: cn('h-11 rounded-md px-5 text-sm font-medium shadow-none', className),
  });

  if (atLimit) {
    return (
      <button type="button" className={classes} disabled>
        <Plus className="size-4" />
        {label}
      </button>
    );
  }

  return (
    <Link href="/assessment/start" className={classes}>
      <Plus className="size-4" />
      {label}
    </Link>
  );
}

function statusStyle(item: SkillAssessmentSummary) {
  const completed = item.status === 'completed';
  const generating = item.generationStatus === 'generating';
  const failed = item.generationStatus === 'failed';
  if (completed) return 'bg-good/15 text-good';
  if (failed) return 'bg-bad/15 text-bad';
  if (generating) return 'bg-warn/15 text-warn';
  return 'bg-primary-soft text-primary';
}

function statusDot(item: SkillAssessmentSummary) {
  const completed = item.status === 'completed';
  const generating = item.generationStatus === 'generating';
  const failed = item.generationStatus === 'failed';
  if (completed) return 'bg-good';
  if (failed) return 'bg-bad';
  if (generating) return 'bg-warn';
  return 'bg-primary';
}

function AssessmentCard({ item }: { item: SkillAssessmentSummary }) {
  const { t } = useTranslation();
  const formatDate = useLocaleDateFormatter();
  const completed = item.status === 'completed';
  const generating = item.generationStatus === 'generating';
  const failed = item.generationStatus === 'failed';
  const levelCopy = useSkillLevelCopy(item.submission?.level ?? 'Beginner');
  const category = AI_CATEGORY_OPTIONS.find((option) => option.name === item.topic);
  const Icon = category?.icon ?? ClipboardList;
  const href = completed
    ? `/assessment/${item.id}/result`
    : failed
      ? null
      : `/assessment/${item.id}`;
  const ctaLabel = completed
    ? t('marketing.viewResults')
    : generating
      ? t('marketing.viewProgress')
      : t('marketing.continueAssessment');
  const statusLabel = completed
    ? t('marketing.statusCompleted')
    : generating
      ? t('marketing.statusGenerating')
      : failed
        ? t('marketing.statusFailed')
        : t('marketing.statusInProgress');

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              'grid size-10 shrink-0 place-items-center rounded-md',
              category?.iconBg ?? 'bg-primary-soft',
            )}
          >
            <Icon className={cn('size-5', category?.iconColor ?? 'text-primary')} strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{item.topic}</p>
            <p className="mt-0.5 text-xs text-ink/45">{formatDate(item.generatedAt)}</p>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium',
            statusStyle(item),
          )}
        >
          <span className={cn('size-1.5 rounded-full', statusDot(item))} aria-hidden="true" />
          {statusLabel}
        </span>
      </div>

      <h3 className="mt-5 line-clamp-2 text-xl font-medium leading-snug text-ink">{item.topicLabel}</h3>

      <div className="mt-4">
        <p className="text-xs text-ink/45">{t('marketing.catalogIncludes')}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
            {t('marketing.questionsCount', { count: String(item.questionCount) })}
          </span>
          {completed && item.submission ? (
            <span className="rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
              {levelCopy.level}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-auto pt-6">
        {completed && item.submission ? (
          <div className="mb-4">
            <p className="mb-1.5 text-xs font-medium text-ink">
              {t('marketing.catalogComplete', { percent: String(item.submission.score) })}
            </p>
            <Progress value={item.submission.score} className="h-2 rounded-full bg-primary/20" />
          </div>
        ) : failed ? (
          <p className="mb-4 text-sm leading-6 text-ink/65">
            {item.failureReason ?? t('marketing.generationFailed')}
          </p>
        ) : null}
        {href ? (
          <span
            className={buttonClasses({
              size: 'lg',
              className: 'h-11 w-full rounded-md text-sm font-medium shadow-none',
            })}
          >
            {ctaLabel}
          </span>
        ) : null}
      </div>
    </>
  );

  return (
    <article className="flex h-full flex-col rounded-md border border-line/80 bg-bg-elev/90 p-5 transition-colors hover:border-primary/35 hover:bg-bg-elev">
      {href ? (
        <Link href={href} className="flex h-full flex-col">
          {body}
        </Link>
      ) : (
        <div className="flex h-full flex-col">{body}</div>
      )}
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
    <section className="flex min-h-full flex-1 flex-col bg-[var(--marketing-hero)] pt-6 pb-16 lg:pt-8 lg:pb-16">
      <Container className="flex flex-1 flex-col">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <header className="max-w-2xl" data-tour="tour-assessments-header">
            <h1 className="font-heading text-[2rem] font-medium leading-[1.18] tracking-[-0.02em] text-ink sm:text-[2.45rem]">
              {t('marketing.yourAssessments')}
            </h1>
            <p className="mt-3 text-base leading-7 text-ink/70">{t('marketing.assessmentsIntro')}</p>
          </header>

          <div
            className="flex items-center gap-3"
            data-tour="tour-assessments-create"
          >
            {quota ? <QuotaLine quota={quota} /> : null}
            <CreateAssessmentButton atLimit={atLimit} label={t('marketing.createAssessment')} />
          </div>
        </div>

        {atLimit && quota ? (
          <div className="mt-4">
            <AssessmentLimitNotice quota={quota} />
          </div>
        ) : null}

        <div className="mt-8 flex flex-1 flex-col">
          {isError ? (
            <div className="mx-auto mt-16 max-w-md text-center">
              <p className="text-lg font-medium text-ink">{t('marketing.loadAssessmentsError')}</p>
              <p className="mt-2 text-sm leading-6 text-ink/65">{t('marketing.loadAssessmentsErrorHint')}</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className={buttonClasses({
                  size: 'lg',
                  className: 'mt-6 h-11 rounded-md px-5 text-sm font-medium shadow-none',
                })}
              >
                {t('marketing.tryAgain')}
              </button>
            </div>
          ) : assessments.length === 0 ? (
            <div className="mx-auto mt-16 max-w-md text-center">
              <p className="text-lg font-medium text-ink">{t('marketing.noAssessmentsYet')}</p>
              <p className="mt-2 text-sm leading-6 text-ink/65">{t('marketing.noAssessmentsHint')}</p>
              <div className="mt-6 flex justify-center">
                <CreateAssessmentButton
                  atLimit={atLimit}
                  label={t('marketing.createFirstAssessment')}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {assessments.map((item) => (
                <AssessmentCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

export default AssessmentsPage;
