'use client';

import { useEffect, useState } from 'react';
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
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
  SKILL_TOPICS,
  type SkillTopic,
} from '@/src/features/skill-assessment/skillAssessmentApi';
import { useGenerateSkillAssessment } from '@/src/features/skill-assessment/useSkillAssessment';

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
  const progress = step === 1 ? 50 : 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-ink">
          Step {step} of 2 — {STEP_LABELS[step - 1]}
        </span>
        <span className="text-ink-3">{progress}% complete</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-line/80">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="hidden gap-6 sm:flex">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <div key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  'grid size-6 place-items-center rounded-full text-xs font-semibold',
                  done && 'bg-primary text-white',
                  active && !done && 'bg-primary text-white',
                  !active && !done && 'border border-line-2 bg-bg-elev text-ink-3',
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : n}
              </span>
              <span className={cn('text-sm', active || done ? 'font-medium text-ink' : 'text-ink-3')}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CreateAssessmentDialog({
  open,
  onClose,
  quota,
}: {
  open: boolean;
  onClose: () => void;
  quota?: SkillAssessmentQuota;
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setError(null);
      setStep(1);
      setTopic('Programming');
      setCustomTopic('');
      setGoal('career');
    }
  }, [open]);

  if (!open) return null;

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
          onClose();
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
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-assessment-title"
        className="relative z-10 flex max-h-[94vh] w-full max-w-[920px] flex-col overflow-hidden rounded-t-2xl border border-line bg-bg-elev shadow-elevated sm:max-h-[90vh] sm:rounded-2xl"
      >
        <div className="border-b border-line px-6 py-5 sm:px-8 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Skill assessment
              </p>
              <h2
                id="create-assessment-title"
                className="mt-1 text-xl font-semibold text-ink sm:text-2xl"
              >
                {step === 1 ? 'Select your subject' : 'Define your learning goal'}
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-2">
                {step === 1
                  ? 'Choose the area you want to evaluate. We will prepare a short 10-question assessment based on your selection.'
                  : 'Tell us what you want to achieve so we can tailor your results and course recommendation.'}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close dialog"
              onClick={onClose}
              className="grid size-10 shrink-0 place-items-center rounded-lg border border-line text-ink-3 transition hover:bg-bg-soft hover:text-ink"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="mt-6">
            <StepProgress step={step} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          {step === 1 ? (
            <div className="space-y-6">
              {quota && quota.limit !== null && (
                <div
                  className={cn(
                    'rounded-xl border px-4 py-3 text-sm',
                    atLimit
                      ? 'border-bad/35 bg-bad-soft text-bad'
                      : 'border-line bg-bg-soft text-ink-2',
                  )}
                  role={atLimit ? 'alert' : undefined}
                >
                  <span className={cn('font-medium', atLimit ? 'text-bad' : 'text-ink')}>
                    {tierPlanLabel(quota.tier)} plan:
                  </span>{' '}
                  {quota.used} of {quota.limit} assessments used
                  {atLimit ? (
                    <span className="font-semibold"> · Limit reached</span>
                  ) : quota.remaining !== null && quota.remaining > 0 ? (
                    ` · ${quota.remaining} remaining`
                  ) : null}
                </div>
              )}

              <fieldset>
                <legend className="mb-4 text-sm font-semibold text-ink">
                  Subject area
                </legend>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
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
                          'flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors',
                          selected
                            ? 'border-primary bg-primary/[0.04]'
                            : 'border-line bg-bg-elev hover:border-primary/30 hover:bg-bg-soft',
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
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              'block text-sm font-medium leading-snug',
                              selected ? 'text-primary' : 'text-ink',
                            )}
                          >
                            {t}
                          </span>
                        </span>
                        {selected && (
                          <Check className="size-4 shrink-0 text-primary" strokeWidth={2.5} />
                        )}
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
                  <p className="mt-2 text-xs text-ink-3">
                    Enter the topic you would like us to assess.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
              <fieldset>
                <legend className="mb-4 text-sm font-semibold text-ink">
                  Primary learning goal
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {GOALS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      aria-pressed={goal === g.value}
                      onClick={() => setGoal(g.value)}
                      className={cn(
                        'flex h-full flex-col rounded-xl border p-4 text-left transition-colors',
                        goal === g.value
                          ? 'border-primary bg-primary/[0.04]'
                          : 'border-line bg-bg-elev hover:border-primary/30 hover:bg-bg-soft',
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

              <aside className="rounded-xl border border-line bg-bg-soft p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
                  Assessment summary
                </p>
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

          {error && (
            <p className="mt-5 rounded-lg border border-bad/20 bg-bad/5 px-4 py-3 text-sm text-bad" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="border-t border-line bg-bg-soft px-6 py-4 sm:px-8">
          {step === 1 ? (
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button size="lg" onClick={goToStep2} disabled={!step1Valid || atLimit}>
                Continue to goal selection
                <ArrowRight className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setError(null);
                  setStep(1);
                }}
                disabled={generate.isPending}
              >
                <ArrowLeft className="size-4" />
                Back to subject
              </Button>
              <Button size="lg" onClick={onCreate} disabled={generate.isPending || atLimit}>
                {generate.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Begin assessment
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateAssessmentDialog;
