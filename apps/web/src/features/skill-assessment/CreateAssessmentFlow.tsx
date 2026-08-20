'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Clock, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Container } from '@/src/components/marketing/Container';
import { buttonClasses } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { ApiError } from '@/src/infrastructure/apiClient';
import type { SkillAssessmentQuota } from '@/src/domain/assessment';
import { TRIAL_PERIOD_MONTHS } from '@/src/constants/pricing';
import { AI_CATEGORY_OPTIONS } from '@/src/constants/aiCategories';
import { isAssessmentQuotaExhausted, tierPlanLabel } from '@/src/constants/tierLimits';
import {
  saveLearningGoal,
  type LearningGoal,
} from '@/src/features/learning-path/learningPathRecommendation';
import { MVP_PRACTICE_MODE } from '@/src/config/mvp';
import { PracticeAssessmentStart } from './PracticeAssessmentStart';
import {
  markAssessmentPromptSeen,
  SKILL_TOPICS,
  type SkillTopic,
} from '@/src/features/skill-assessment/skillAssessmentApi';
import {
  useGenerateSkillAssessment,
  useMySkillAssessments,
} from '@/src/features/skill-assessment/useSkillAssessment';
import {
  useTranslation,
  useAssessmentGoals,
  useTopicLabel,
  useIsRtl,
} from '@/src/i18n';

const TOPIC_META = Object.fromEntries(
  AI_CATEGORY_OPTIONS.map(({ name, icon, iconBg, iconColor }) => [
    name,
    { icon, iconBg, iconColor },
  ]),
) as Record<SkillTopic, { icon: LucideIcon; iconBg: string; iconColor: string }>;

function StepProgress({ step }: { step: 1 | 2 }) {
  const { t } = useTranslation();
  const stepLabel = step === 1 ? t('marketing.stepSelectSubject') : t('marketing.stepChooseGoal');

  return (
    <div className="mt-6 max-w-md">
      <div className="flex items-center justify-between gap-4 text-xs font-medium">
        <span className="text-ink/55">
          {t('marketing.stepOf', { step: String(step), label: stepLabel })}
        </span>
        <span className="tabular-nums text-ink/45">{step === 1 ? '50%' : '100%'}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary/20">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: step === 1 ? '50%' : '100%' }}
        />
      </div>
    </div>
  );
}

export function CreateAssessmentFlow({
  quota,
  onCancel,
}: {
  quota?: SkillAssessmentQuota;
  onCancel: () => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const goals = useAssessmentGoals();
  const generate = useGenerateSkillAssessment();
  const [step, setStep] = useState<1 | 2>(1);
  const [topic, setTopic] = useState<SkillTopic>('Artificial Intelligence');
  const [goal, setGoal] = useState<LearningGoal>('career');
  const [error, setError] = useState<string | null>(null);

  const atLimit = isAssessmentQuotaExhausted(quota);
  const selectedGoal = goals.find((g) => g.value === goal);

  function goToStep2() {
    setError(null);
    setStep(2);
  }

  function onCreate() {
    setError(null);
    if (atLimit) {
      setError(t('marketing.errorLimitReached'));
      return;
    }
    saveLearningGoal(goal);
    generate.mutate(
      { topic },
      {
        onSuccess: (assessment) => {
          markAssessmentPromptSeen();
          router.push(`/assessment/${assessment.id}`);
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 429) {
            setError(err.message);
            return;
          }
          setError(t('marketing.errorStartFailed'));
        },
      },
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-line/80 bg-bg-elev/90">
      <div className="border-b border-line/70 px-5 py-6 sm:px-8 sm:py-8">
        <h2 className="font-heading text-[1.65rem] font-medium leading-[1.2] tracking-[-0.02em] text-ink sm:text-[1.9rem]">
          {step === 1 ? t('marketing.selectSubjectTitle') : t('marketing.defineGoalTitle')}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-ink/70 sm:text-base">
          {step === 1 ? t('marketing.selectSubjectDesc') : t('marketing.defineGoalDesc')}
        </p>
        <StepProgress step={step} />
      </div>

      <div className="px-5 py-6 sm:px-8 sm:py-8">
        {step === 1 ? (
          <div className="space-y-6">
            {atLimit && quota ? (
              <div
                className="rounded-md border border-bad/30 bg-bad-soft px-4 py-3 text-sm text-bad"
                role="alert"
              >
                {t('marketing.planLimitReached', { tier: tierPlanLabel(quota.tier) })}
              </div>
            ) : null}

            <fieldset>
              <legend className="mb-3 text-sm font-medium text-ink">{t('marketing.subjectArea')}</legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {SKILL_TOPICS.map((topicKey) => {
                  const meta = TOPIC_META[topicKey];
                  return (
                    <TopicButton
                      key={topicKey}
                      topicKey={topicKey}
                      selected={topic === topicKey}
                      onSelect={() => setTopic(topicKey)}
                      meta={meta}
                    />
                  );
                })}
              </div>
            </fieldset>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-start">
            <fieldset>
              <legend className="mb-3 text-sm font-medium text-ink">{t('marketing.primaryGoal')}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {goals.map((g) => {
                  const selected = goal === g.value;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setGoal(g.value)}
                      className={cn(
                        'flex h-full flex-col rounded-md border p-4 text-left transition-colors',
                        selected
                          ? 'border-primary/60 bg-primary/[0.04]'
                          : 'border-line/80 bg-bg-elev/90 hover:border-primary/35 hover:bg-bg-elev',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-sm font-medium text-ink">{g.title}</span>
                        <span
                          className={cn(
                            'grid size-5 shrink-0 place-items-center rounded-md border',
                            selected
                              ? 'border-primary bg-primary text-primary-ink'
                              : 'border-line bg-bg-elev',
                          )}
                        >
                          {selected ? <Check className="size-3" strokeWidth={3} /> : null}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-ink/65">{g.desc}</p>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <aside className="rounded-md border border-line/80 bg-bg-elev p-5">
              <p className="text-sm font-medium text-ink">{t('marketing.assessmentSummary')}</p>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="text-xs text-ink/45">{t('marketing.summarySubject')}</dt>
                  <dd className="mt-1 font-medium text-ink">
                    <TopicSummaryLabel topic={topic} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink/45">{t('marketing.summaryGoal')}</dt>
                  <dd className="mt-1 font-medium text-ink">{selectedGoal?.title}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink/45">{t('marketing.summaryFormat')}</dt>
                  <dd className="mt-1 text-ink/70">{t('marketing.summaryFormatValue')}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink/45">{t('marketing.summaryAfter')}</dt>
                  <dd className="mt-1 text-ink/70">{t('marketing.summaryAfterValue')}</dd>
                </div>
              </dl>
              <div className="mt-5 flex items-center gap-2 rounded-md border border-line/80 bg-bg-soft/80 px-3 py-2.5 text-xs text-ink/55">
                <Clock className="size-4 shrink-0 text-primary" />
                {t('marketing.trialNote', { months: String(TRIAL_PERIOD_MONTHS) })}
              </div>
            </aside>
          </div>
        )}

        {error ? (
          <p
            className="mt-6 rounded-md border border-bad/30 bg-bad-soft px-4 py-3 text-sm text-bad"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-line/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        {step === 1 ? (
          <>
            <button
              type="button"
              onClick={onCancel}
              className="text-sm font-medium text-ink/55 transition hover:text-ink"
            >
              {t('marketing.skipForNow')}
            </button>
            <button
              type="button"
              onClick={goToStep2}
              disabled={atLimit}
              className={buttonClasses({
                size: 'lg',
                className: 'h-11 rounded-md px-5 text-sm font-medium shadow-none',
              })}
            >
              {t('common.continue')}
              <ArrowRight className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep(1);
              }}
              disabled={generate.isPending}
              className={buttonClasses({
                variant: 'outline',
                className: 'h-11 rounded-md bg-transparent px-5 text-sm font-medium',
              })}
            >
              <ArrowLeft className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
              {t('createCourse.back')}
            </button>
            <button
              type="button"
              onClick={onCreate}
              disabled={generate.isPending || atLimit}
              className={buttonClasses({
                size: 'lg',
                className: 'h-11 rounded-md px-5 text-sm font-medium shadow-none',
              })}
            >
              {generate.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowRight className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
              )}
              {t('marketing.beginAssessment')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function TopicButton({
  topicKey,
  selected,
  onSelect,
  meta,
}: {
  topicKey: SkillTopic;
  selected: boolean;
  onSelect: () => void;
  meta: { icon: LucideIcon; iconBg: string; iconColor: string };
}) {
  const label = useTopicLabel(topicKey);
  const Icon = meta.icon;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        'flex min-h-[68px] items-center gap-3 rounded-md border px-4 py-3.5 text-left transition-colors',
        selected
          ? 'border-primary/60 bg-primary/[0.04]'
          : 'border-line/80 bg-bg-elev/90 hover:border-primary/35 hover:bg-bg-elev',
      )}
    >
      <span className={cn('grid size-10 shrink-0 place-items-center rounded-md', meta.iconBg)}>
        <Icon className={cn('size-5', meta.iconColor)} strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-ink">{label}</span>
      {selected ? <Check className="size-4 shrink-0 text-primary" strokeWidth={2.5} /> : null}
    </button>
  );
}

function TopicSummaryLabel({ topic }: { topic: SkillTopic }) {
  const label = useTopicLabel(topic);
  return label || topic;
}

export function StartAssessmentPage() {
  if (MVP_PRACTICE_MODE) {
    return <PracticeAssessmentStart />;
  }

  return <LegacyStartAssessmentPage />;
}

function LegacyStartAssessmentPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const assessmentsQ = useMySkillAssessments();

  function handleCancel() {
    markAssessmentPromptSeen();
    router.push('/assessments');
  }

  return (
    <section className="flex min-h-full flex-1 flex-col bg-[var(--marketing-hero)] pt-6 pb-16 lg:pt-8 lg:pb-16">
      <Container>
        <header className="max-w-2xl">
          <h1 className="font-heading text-[2rem] font-medium leading-[1.18] tracking-[-0.02em] text-ink sm:text-[2.45rem]">
            {t('marketing.startPageTitle')}
          </h1>
          <p className="mt-3 text-base leading-7 text-ink/70">{t('marketing.startPageDescription')}</p>
        </header>

        <div className="mt-8">
          <CreateAssessmentFlow quota={assessmentsQ.data?.quota} onCancel={handleCancel} />
        </div>

        <p className="mt-8 text-sm text-ink/45">
          {t('marketing.preferExplore')}{' '}
          <Link href="/courses" className="font-medium text-primary hover:text-primary-dark">
            {t('marketing.browseCourses')}
          </Link>
        </p>
      </Container>
    </section>
  );
}
