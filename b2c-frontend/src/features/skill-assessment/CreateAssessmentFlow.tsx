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
  ASSESSMENT_SEEN_KEY,
  SKILL_TOPICS,
  type SkillTopic,
} from '@/src/features/skill-assessment/skillAssessmentApi';
import { useGenerateSkillAssessment, useMySkillAssessments } from '@/src/features/skill-assessment/useSkillAssessment';

const STEP_LABELS = ['Select subject', 'Choose goal'] as const;

const GOALS: { value: LearningGoal; title: string; desc: string }[] = [
  {
    value: 'career',
    title: 'Career growth',
    desc: 'Build practical, job-ready skills over time.',
  },
  {
    value: 'hands_on',
    title: 'Hands-on practice',
    desc: 'Focus on labs, exercises, and applied learning.',
  },
  {
    value: 'certification',
    title: 'Certification prep',
    desc: 'Follow a structured path toward exams and credentials.',
  },
  {
    value: 'exploring',
    title: 'Exploring options',
    desc: 'Discover your level and decide what to learn next.',
  },
];

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
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-ink-2">
          Step {step} of 2 · {STEP_LABELS[step - 1]}
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
  const selectedGoal = GOALS.find((g) => g.value === goal);

  function goToStep2() {
    setError(null);
    if (!step1Valid) {
      setError('Please enter the subject you would like to assess.');
      return;
    }
    setStep(2);
  }

  function onCreate() {
    setError(null);
    if (atLimit) {
      setError('You have reached the assessment limit for your current plan.');
      return;
    }
    if (!step1Valid) {
      setError('Please enter the subject you would like to assess.');
      setStep(1);
      return;
    }
    saveLearningGoal(goal);
    generate.mutate(
      { topic, customTopic: topic === 'Other' ? customTopic.trim() : undefined },
      {
        onSuccess: (assessment) => {
          router.push(`/assessment/${assessment.id}`);
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 429) {
            setError(err.message);
            return;
          }
          setError('We could not start your assessment. Please try again.');
        },
      },
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card">
      <div className="border-b border-line px-6 py-8 sm:px-10">
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {step === 1 ? 'Select your subject' : 'Define your learning goal'}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-ink-2 sm:text-base">
          {step === 1
            ? 'Choose the area you want to evaluate. A 10-question assessment will be prepared from your selection.'
            : 'Select your primary objective so we can tailor your results and course recommendation.'}
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
                Your {tierPlanLabel(quota.tier)} plan limit has been reached. Complete an existing
                assessment or upgrade to create more.
              </div>
            ) : null}

            <fieldset>
              <legend className="mb-4 text-sm font-semibold text-ink">Subject area</legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {SKILL_TOPICS.map((t) => {
                  const meta = TOPIC_META[t];
                  const Icon = meta.icon;
                  const selected = topic === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setTopic(t)}
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
                      <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-ink">
                        {t}
                      </span>
                      {selected ? <Check className="size-4 shrink-0 text-primary" strokeWidth={2.5} /> : null}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {topic === 'Other' && (
              <div>
                <label htmlFor="custom-topic" className="mb-2 block text-sm font-medium text-ink">
                  Custom subject
                </label>
                <input
                  id="custom-topic"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="For example: Cloud computing, UI design, project management"
                  className="h-12 w-full rounded-xl border border-line bg-bg-elev px-4 text-sm text-ink outline-none transition placeholder:text-ink-3 focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-start">
            <fieldset>
              <legend className="mb-4 text-sm font-semibold text-ink">Primary learning goal</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {GOALS.map((g) => (
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
              <p className="text-sm font-semibold text-ink">Assessment summary</p>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="text-ink-3">Subject</dt>
                  <dd className="mt-1 font-medium text-ink">{topicLabel}</dd>
                </div>
                <div>
                  <dt className="text-ink-3">Goal</dt>
                  <dd className="mt-1 font-medium text-ink">{selectedGoal?.title}</dd>
                </div>
                <div>
                  <dt className="text-ink-3">Format</dt>
                  <dd className="mt-1 text-ink-2">10 questions · approximately 5 minutes</dd>
                </div>
                <div>
                  <dt className="text-ink-3">After completion</dt>
                  <dd className="mt-1 text-ink-2">
                    You will receive your skill level and a personalized course recommendation.
                  </dd>
                </div>
              </dl>
              <div className="mt-5 flex items-center gap-2 rounded-lg border border-line bg-bg-elev px-3 py-2.5 text-xs text-ink-2">
                <Clock className="size-4 shrink-0 text-primary" />
                New accounts include {TRIAL_PERIOD_MONTHS} months of free access.
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
              Skip for now
            </button>
            <Button
              size="lg"
              onClick={goToStep2}
              disabled={!step1Valid || atLimit}
              className="h-11 rounded-full px-6"
            >
              Continue
              <ArrowRight className="size-4" />
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
              <ArrowLeft className="size-4" />
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
                <ArrowRight className="size-4" />
              )}
              Begin assessment
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function StartAssessmentPage() {
  const router = useRouter();
  const assessmentsQ = useMySkillAssessments();

  function handleCancel() {
    localStorage.setItem(ASSESSMENT_SEEN_KEY, '1');
    router.push('/');
  }

  return (
    <div className="bg-bg pb-20 pt-10 lg:pt-12">
      <Container>
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Skill assessment
            </h1>
            <p className="mt-3 text-base leading-7 text-ink-2">
              Complete a brief evaluation to identify your level and receive a tailored learning
              recommendation.
            </p>
          </div>

          <CreateAssessmentFlow quota={assessmentsQ.data?.quota} onCancel={handleCancel} />

          <p className="mt-8 text-sm text-ink-3">
            Prefer to explore first?{' '}
            <Link href="/courses" className="font-medium text-primary hover:text-primary-dark">
              Browse courses
            </Link>
          </p>
        </div>
      </Container>
    </div>
  );
}
