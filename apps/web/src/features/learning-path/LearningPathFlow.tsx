'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Check,
  GraduationCap,
  Route,
  Sparkles,
  Target,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Container } from '@/src/components/marketing/Container';
import { cn } from '@/src/lib/utils';
import { TRIAL_PERIOD_MONTHS } from '@/src/constants/pricing';
import {
  SKILL_TOPICS,
  type SkillTopic,
} from '@/src/features/skill-assessment/skillAssessmentApi';
import { useAuthStore } from '@/src/store/authStore';
import type { LearningGoal } from './learningPathRecommendation';
import {
  buildLandingPathPrefill,
  saveLearningGoal,
  saveLearningPathPrefill,
} from './learningPathRecommendation';

const GOALS: { value: LearningGoal; title: string; desc: string }[] = [
  {
    value: 'career',
    title: 'Career growth',
    desc: 'Build job-ready skills step by step.',
  },
  {
    value: 'hands_on',
    title: 'Hands-on practice',
    desc: 'Learn by doing in labs and exercises.',
  },
  {
    value: 'certification',
    title: 'Certification prep',
    desc: 'Structured path toward exams and credentials.',
  },
  {
    value: 'exploring',
    title: 'Just exploring',
    desc: 'Discover what to learn next at your pace.',
  },
];

const FLOW_STEPS = [
  { label: 'Choose topic', icon: Target },
  { label: 'Set your goal', icon: Route },
] as const;

export function LearningPathFlow() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState<SkillTopic>('Artificial Intelligence');
  const [goal, setGoal] = useState<LearningGoal>('career');
  const [error, setError] = useState<string | null>(null);

  const topicLabel = topic;

  function finishPath() {
    setError(null);
    saveLearningGoal(goal);
    saveLearningPathPrefill(
      buildLandingPathPrefill({
        topic,
        goal,
      }),
    );
    if (isAuthenticated) {
      router.push('/create-course?auto=1');
      return;
    }
    router.push('/signup?redirect=%2Fcreate-course%3Fauto%3D1');
  }

  return (
    <section id="learning-path" className="relative overflow-hidden bg-[#F4FAFA] py-20 lg:py-28">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(13,110,99,0.08) 0%, transparent 45%), radial-gradient(circle at 80% 0%, rgba(247,201,72,0.06) 0%, transparent 40%)',
        }}
      />

      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white px-4 py-1.5 text-sm font-semibold text-primary shadow-sm">
            <Sparkles className="size-4" />
            Personalized learning path
          </div>
          <h2 className="mt-6 text-[32px] font-bold leading-[1.15] tracking-tight text-ink sm:text-[44px]">
            Find your path in{' '}
            <span className="bg-gradient-to-r from-primary to-[#12A594] bg-clip-text text-transparent">
              2 quick steps
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-ink-2 sm:text-lg">
            Tell us what you want to learn and your goal — we&apos;ll recommend a tailored
            AI-built course. Start with {TRIAL_PERIOD_MONTHS} months free.
          </p>
        </div>

        <div className="mx-auto mt-12 flex max-w-md items-center justify-center gap-0">
          {FLOW_STEPS.map((s, i) => {
            const n = i + 1;
            const Icon = s.icon;
            const active = n === step;
            const done = n < step;
            return (
              <div key={s.label} className="flex items-center">
                <div className="flex flex-col items-center gap-2.5">
                  <span
                    className={cn(
                      'grid size-11 place-items-center rounded-full border-2 transition-all duration-300',
                      done && 'border-primary bg-primary text-white shadow-md shadow-primary/25',
                      active &&
                        !done &&
                        'border-primary bg-white text-primary shadow-[0_0_0_4px_rgba(13,110,99,0.12)]',
                      !active && !done && 'border-line-2 bg-white text-ink-3',
                    )}
                  >
                    {done ? (
                      <Check className="size-5" strokeWidth={3} />
                    ) : (
                      <Icon className="size-4" />
                    )}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-semibold sm:text-sm',
                      active || done ? 'text-ink' : 'text-ink-3',
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {n < FLOW_STEPS.length && (
                  <span
                    className={cn(
                      'mx-3 mb-7 h-0.5 w-16 rounded-full sm:w-24',
                      n < step ? 'bg-primary' : 'bg-line-2',
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-12 max-w-2xl overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] ring-1 ring-line/60">
          <div className="border-b border-line/80 bg-gradient-to-r from-primary/[0.04] via-white to-secondary/[0.04] px-6 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-primary text-white">
                <GraduationCap className="size-5" />
              </span>
              <div className="text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
                  Step {step} of {FLOW_STEPS.length}
                </p>
                <p className="text-sm font-semibold text-ink">
                  {step === 1 ? 'Choose your subject' : 'Define your learning goal'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {step === 1 && (
              <div>
                <h3 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                  What do you want to learn?
                </h3>
                <p className="mt-2 text-sm leading-6 text-ink-2">
                  Pick a subject — we&apos;ll tailor your course recommendation.
                </p>

                <div className="mt-7 flex flex-wrap gap-2.5">
                  {SKILL_TOPICS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTopic(t)}
                      className={cn(
                        'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                        topic === t
                          ? 'bg-primary text-white shadow-md shadow-primary/20'
                          : 'bg-[#F4F7F8] text-ink-2 hover:bg-primary/10 hover:text-primary',
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="mt-8 flex justify-end border-t border-line/60 pt-6">
                  <Button
                    size="lg"
                    className="min-w-[140px] rounded-xl"
                    onClick={() => setStep(2)}
                  >
                    Continue <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h3 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                  What&apos;s your goal?
                </h3>
                <p className="mt-2 text-sm leading-6 text-ink-2">
                  We&apos;ll shape your learning path around what matters most to you.
                </p>

                <div className="mt-6 grid gap-3">
                  {GOALS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGoal(g.value)}
                      className={cn(
                        'flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200',
                        goal === g.value
                          ? 'border-primary/30 bg-primary/[0.06] shadow-sm ring-1 ring-primary/10'
                          : 'border-line/80 bg-[#FAFBFC] hover:border-primary/20 hover:bg-white',
                      )}
                    >
                      <span
                        className={cn(
                          'grid size-5 shrink-0 place-items-center rounded-full border-2 transition',
                          goal === g.value
                            ? 'border-primary bg-primary text-white'
                            : 'border-line-2 bg-white',
                        )}
                      >
                        {goal === g.value && <Check className="size-3" strokeWidth={3} />}
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold text-ink">{g.title}</div>
                        <div className="mt-0.5 text-sm text-ink-2">{g.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/[0.05] to-transparent p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                    Your path preview
                  </p>
                  <p className="mt-2 text-lg font-bold text-ink">{topicLabel}</p>
                  <p className="mt-1 text-sm text-ink-2">
                    Goal: {GOALS.find((g) => g.value === goal)?.title}
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-ink-2">
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      AI-generated course matched to your topic
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      Hands-on labs, quizzes, and progress tracking
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {TRIAL_PERIOD_MONTHS} months free when you sign up
                    </li>
                  </ul>
                </div>

                {error && (
                  <p className="mt-4 text-sm text-bad" role="alert">
                    {error}
                  </p>
                )}

                <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <Button variant="ghost" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {!isAuthenticated && (
                      <Link href="/login?redirect=%2Fcreate-course%3Fauto%3D1">
                        <Button variant="soft" size="lg" className="w-full rounded-xl sm:w-auto">
                          Log in
                        </Button>
                      </Link>
                    )}
                    <Button size="lg" className="rounded-xl" onClick={finishPath}>
                      <Sparkles className="size-4" />
                      {isAuthenticated ? 'Generate my course' : 'Start free'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

export default LearningPathFlow;
