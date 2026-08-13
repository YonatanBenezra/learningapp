'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  Clock,
  Code2,
  Dumbbell,
  LayoutGrid,
  Loader2,
  Network,
  Shield,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Container } from '@/src/components/marketing/Container';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { ApiError } from '@/src/infrastructure/apiClient';
import type { SkillAssessmentQuota } from '@/src/domain/assessment';
import { TRIAL_PERIOD_MONTHS } from '@/src/constants/pricing';
import {
  isAssessmentQuotaExhausted,
  tierPlanLabel,
} from '@/src/constants/tierLimits';
import {
  saveLearningGoal,
  type LearningGoal,
} from '@/src/features/learning-path/learningPathRecommendation';
import {
  markAssessmentPromptSeen,
  SKILL_TOPICS,
  type SkillTopic,
} from '@/src/features/skill-assessment/skillAssessmentApi';
import { useGenerateSkillAssessment, useMySkillAssessments } from '@/src/features/skill-assessment/useSkillAssessment';
import {
  useTranslation,
  useAssessmentGoals,
  useTopicLabel,
  useIsRtl,
} from '@/src/i18n';

const TOPIC_META: Record<
  SkillTopic,
  { icon: LucideIcon; iconBg: string; iconColor: string }
> = {
  Programming: { icon: Code2, iconBg: 'bg-primary-soft', iconColor: 'text-primary' },
  'Artificial Intelligence': { icon: Brain, iconBg: 'bg-tint-lav', iconColor: 'text-[#7C3AED]' },
  'Cyber Security': { icon: ShieldCheck, iconBg: 'bg-tint-mint', iconColor: 'text-good' },
  Networking: { icon: Network, iconBg: 'bg-tint-blue', iconColor: 'text-[#2563EB]' },
  'Data Science': { icon: BarChart3, iconBg: 'bg-tint-peach', iconColor: 'text-secondary' },
  'Health & Fitness': { icon: Dumbbell, iconBg: 'bg-tint-pink', iconColor: 'text-[#DB2777]' },
  Security: { icon: Shield, iconBg: 'bg-bg-soft', iconColor: 'text-primary-deep' },
  General: { icon: LayoutGrid, iconBg: 'bg-tint-lime', iconColor: 'text-[#65A30D]' },
  Other: { icon: Sparkles, iconBg: 'bg-primary-soft', iconColor: 'text-primary' },
};

function StepProgress({ step }: { step: 1 | 2 }) {
  const { t } = useTranslation();
  const stepLabel = step === 1 ? t('marketing.stepSelectSubject') : t('marketing.stepChooseGoal');

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-ink-2">
          {t('marketing.stepOf', { step: String(step), label: stepLabel })}
        </span>
        <span className="text-ink-3">{step === 1 ? '50%' : '100%'}</span>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-line">
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
  const [topic, setTopic] = useState<SkillTopic>('Programming');
  const [customTopic, setCustomTopic] = useState('');
  const [goal, setGoal] = useState<LearningGoal>('career');
  const [error, setError] = useState<string | null>(null);

  const atLimit = isAssessmentQuotaExhausted(quota);
  const topicLabel =
    topic === 'Other' && customTopic.trim() ? customTopic.trim() : topic;
  const step1Valid = topic !== 'Other' || customTopic.trim().length > 0;
  const selectedGoal = goals.find((g) => g.value === goal);

  function goToStep2() {
    setError(null);
    if (!step1Valid) {
      setError(t('marketing.errorSubjectRequired'));
      return;
    }
    setStep(2);
  }

  function onCreate() {
    setError(null);
    if (atLimit) {
      setError(t('marketing.errorLimitReached'));
      return;
    }
    if (!step1Valid) {
      setError(t('marketing.errorSubjectRequired'));
      setStep(1);
      return;
    }
    saveLearningGoal(goal);
    generate.mutate(
      { topic, customTopic: topic === 'Other' ? customTopic.trim() : undefined },
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
    <div className="overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card">
      <div className="border-b border-line px-6 py-8 sm:px-10">
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {step === 1 ? t('marketing.selectSubjectTitle') : t('marketing.defineGoalTitle')}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-ink-2 sm:text-base">
          {step === 1 ? t('marketing.selectSubjectDesc') : t('marketing.defineGoalDesc')}
        </p>
        <StepProgress step={step} />
      </div>

      <div className="px-6 py-8 sm:px-10">
        {step === 1 ? (
          <div className="space-y-8">
            {atLimit && quota ? (
              <div
                className="rounded-lg border border-bad/35 bg-bad-soft px-4 py-3 text-sm text-bad"
                role="alert"
              >
                {t('marketing.planLimitReached', { tier: tierPlanLabel(quota.tier) })}
              </div>
            ) : null}

            <fieldset>
              <legend className="mb-4 text-sm font-semibold text-ink">{t('marketing.subjectArea')}</legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {SKILL_TOPICS.map((topicKey) => {
                  const meta = TOPIC_META[topicKey];
                  const Icon = meta.icon;
                  const selected = topic === topicKey;
                  return (
                    <TopicButton
                      key={topicKey}
                      topicKey={topicKey}
                      selected={selected}
                      onSelect={() => setTopic(topicKey)}
                      meta={meta}
                      Icon={Icon}
                    />
                  );
                })}
              </div>
            </fieldset>

            {topic === 'Other' && (
              <div>
                <label htmlFor="custom-topic" className="mb-2 block text-sm font-medium text-ink">
                  {t('marketing.customSubject')}
                </label>
                <input
                  id="custom-topic"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder={t('marketing.customSubjectPlaceholder')}
                  className="h-12 w-full rounded-xl border border-line bg-bg-elev px-4 text-sm text-ink outline-none transition placeholder:text-ink-3 focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-start">
            <fieldset>
              <legend className="mb-4 text-sm font-semibold text-ink">{t('marketing.primaryGoal')}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {goals.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    aria-pressed={goal === g.value}
                    onClick={() => setGoal(g.value)}
                    className={cn(
                      'flex h-full flex-col rounded-lg border p-4 text-left transition-colors',
                      goal === g.value
                        ? 'border-primary bg-primary/[0.04]'
                        : 'border-line bg-bg-elev hover:border-line-2 hover:bg-bg-soft',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm font-semibold text-ink">{g.title}</span>
                      <span
                        className={cn(
                          'grid size-5 shrink-0 place-items-center rounded-full border',
                          goal === g.value
                            ? 'border-primary bg-primary text-white'
                            : 'border-line-2 bg-bg-elev',
                        )}
                      >
                        {goal === g.value && <Check className="size-3" strokeWidth={3} />}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ink-2">{g.desc}</p>
                  </button>
                ))}
              </div>
            </fieldset>

            <aside className="rounded-lg border border-line bg-bg-soft p-5">
              <p className="text-sm font-semibold text-ink">{t('marketing.assessmentSummary')}</p>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="text-ink-3">{t('marketing.summarySubject')}</dt>
                  <dd className="mt-1 font-medium text-ink">
                    <TopicSummaryLabel topic={topic} customTopic={customTopic} fallback={topicLabel} />
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-3">{t('marketing.summaryGoal')}</dt>
                  <dd className="mt-1 font-medium text-ink">{selectedGoal?.title}</dd>
                </div>
                <div>
                  <dt className="text-ink-3">{t('marketing.summaryFormat')}</dt>
                  <dd className="mt-1 text-ink-2">{t('marketing.summaryFormatValue')}</dd>
                </div>
                <div>
                  <dt className="text-ink-3">{t('marketing.summaryAfter')}</dt>
                  <dd className="mt-1 text-ink-2">{t('marketing.summaryAfterValue')}</dd>
                </div>
              </dl>
              <div className="mt-5 flex items-center gap-2 rounded-lg border border-line bg-bg-elev px-3 py-2.5 text-xs text-ink-2">
                <Clock className="size-4 shrink-0 text-primary" />
                {t('marketing.trialNote', { months: String(TRIAL_PERIOD_MONTHS) })}
              </div>
            </aside>
          </div>
        )}

        {error ? (
          <p
            className="mt-6 rounded-xl border border-bad/20 bg-bad/5 px-4 py-3 text-sm text-bad"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-line px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        {step === 1 ? (
          <>
            <button
              type="button"
              onClick={onCancel}
              className="text-sm font-medium text-ink-2 transition hover:text-ink"
            >
              {t('marketing.skipForNow')}
            </button>
            <Button
              size="lg"
              onClick={goToStep2}
              disabled={!step1Valid || atLimit}
              className="h-11 rounded-full px-6"
            >
              {t('common.continue')}
              <ArrowRight className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => {
                setError(null);
                setStep(1);
              }}
              disabled={generate.isPending}
              className="h-11 rounded-full px-5"
            >
              <ArrowLeft className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
              Back
            </Button>
            <Button
              size="lg"
              onClick={onCreate}
              disabled={generate.isPending || atLimit}
              className="h-11 rounded-full px-6"
            >
              {generate.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowRight className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
              )}
              {t('marketing.beginAssessment')}
            </Button>
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
  Icon,
}: {
  topicKey: SkillTopic;
  selected: boolean;
  onSelect: () => void;
  meta: { iconBg: string; iconColor: string };
  Icon: LucideIcon;
}) {
  const label = useTopicLabel(topicKey);

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        'flex min-h-[68px] items-center gap-3 rounded-lg border px-4 py-3.5 text-left transition-colors',
        selected
          ? 'border-primary bg-primary/[0.04]'
          : 'border-line bg-bg-elev hover:border-line-2 hover:bg-bg-soft',
      )}
    >
      <span
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-lg',
          meta.iconBg,
        )}
      >
        <Icon className={cn('size-4', meta.iconColor)} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-ink">{label}</span>
      {selected ? <Check className="size-4 shrink-0 text-primary" strokeWidth={2.5} /> : null}
    </button>
  );
}

function TopicSummaryLabel({
  topic,
  customTopic,
  fallback,
}: {
  topic: SkillTopic;
  customTopic: string;
  fallback: string;
}) {
  const label = useTopicLabel(topic);
  if (topic === 'Other' && customTopic.trim()) return customTopic.trim();
  return label || fallback;
}

export function StartAssessmentPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const assessmentsQ = useMySkillAssessments();

  function handleCancel() {
    markAssessmentPromptSeen();
    router.push('/');
  }

  return (
    <div className="bg-bg pb-20 pt-10 lg:pt-12">
      <Container>
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {t('marketing.startPageTitle')}
            </h1>
            <p className="mt-3 text-base leading-7 text-ink-2">
              {t('marketing.startPageDescription')}
            </p>
          </div>

          <CreateAssessmentFlow quota={assessmentsQ.data?.quota} onCancel={handleCancel} />

          <p className="mt-8 text-sm text-ink-3">
            {t('marketing.preferExplore')}{' '}
            <Link href="/courses" className="font-medium text-primary hover:text-primary-dark">
              {t('marketing.browseCourses')}
            </Link>
          </p>
        </div>
      </Container>
    </div>
  );
}
