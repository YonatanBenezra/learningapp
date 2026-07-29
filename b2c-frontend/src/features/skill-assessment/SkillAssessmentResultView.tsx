'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Container } from '@/src/components/marketing/Container';
import { CreateCourseFromRecommendation } from '@/src/features/learning-path/CreateCourseFromRecommendation';
import {
  getLearningPathSteps,
  getRecommendedCourseTitle,
  type LearningPathPrefill,
} from '@/src/features/learning-path/learningPathRecommendation';
import type {
  AssessmentQuestion,
  SkillAssessmentSubmission,
  SkillLevel,
} from '@/src/domain/assessment';
import { cn } from '@/src/lib/utils';

const GOAL_LABELS: Record<NonNullable<LearningPathPrefill['goal']>, string> = {
  career: 'Career growth',
  hands_on: 'Hands-on practice',
  certification: 'Certification prep',
  exploring: 'Exploring options',
};

const LEVEL_COPY: Record<
  SkillLevel,
  {
    description: string;
    track: string;
    accentClass: string;
    barClass: string;
    badgeClass: string;
  }
> = {
  Beginner: {
    description:
      'You are establishing your foundation. A structured introductory course will help you build reliable core knowledge.',
    track: 'Foundation track',
    accentClass: 'text-primary',
    barClass: 'bg-primary',
    badgeClass: 'border-primary/20 bg-primary-soft text-primary',
  },
  Intermediate: {
    description:
      'You demonstrate a solid base. Structured modules with practical exercises are the appropriate next step.',
    track: 'Growth track',
    accentClass: 'text-primary',
    barClass: 'bg-primary',
    badgeClass: 'border-primary/20 bg-primary-soft text-primary',
  },
  Advanced: {
    description:
      'Your results indicate strong subject knowledge. Advanced labs and applied projects will extend your capability.',
    track: 'Advanced track',
    accentClass: 'text-secondary',
    barClass: 'bg-secondary',
    badgeClass: 'border-secondary/20 bg-secondary-soft text-secondary',
  },
  Expert: {
    description:
      'Your performance reflects mastery at this level. Expert curriculum and specialized practice areas are recommended.',
    track: 'Expert track',
    accentClass: 'text-good',
    barClass: 'bg-good',
    badgeClass: 'border-good/20 bg-good-soft text-good',
  },
};

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-elev px-4 py-3.5 text-center">
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums text-ink">{value}</dd>
    </div>
  );
}

export function SkillAssessmentResultView({
  topicLabel,
  questions,
  submission,
  answers,
  prefill,
}: {
  topicLabel: string;
  questions: AssessmentQuestion[];
  submission: SkillAssessmentSubmission;
  answers: Record<number, string>;
  prefill: LearningPathPrefill;
}) {
  const levelInfo = LEVEL_COPY[submission.level];
  const results = [...submission.results].sort((a, b) => a.questionIndex - b.questionIndex);
  const correctCount = results.filter((r) => r.correct).length;
  const incorrectCount = results.length - correctCount;
  const accuracyPercent = Math.round((correctCount / results.length) * 100);
  const pathSteps = getLearningPathSteps(prefill);
  const recommendedTitle = getRecommendedCourseTitle(prefill);
  const goalLabel = prefill.goal ? GOAL_LABELS[prefill.goal] : null;

  return (
    <div className="bg-bg pb-28 pt-10 lg:pt-12">
      <Container>
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium text-ink-2">Assessment complete</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                {topicLabel}
              </h1>
              <p className="mt-3 text-base leading-7 text-ink-2">
                Your responses have been evaluated. Review your skill level, recommended learning
                path, and question-by-question breakdown below.
              </p>
            </div>

            <dl className="grid min-w-[280px] grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line sm:min-w-[320px]">
              <StatItem label="Score" value={`${submission.score}%`} />
              <StatItem label="Correct" value={`${correctCount}/${results.length}`} />
              <StatItem label="Level" value={submission.level} />
            </dl>
          </div>

          <div className="overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card">
            <div className="grid lg:grid-cols-[1fr_280px] lg:divide-x lg:divide-line">
              <div className="px-6 py-8 sm:px-10 sm:py-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium',
                      levelInfo.badgeClass,
                    )}
                  >
                    <GraduationCap className="size-3.5" />
                    {levelInfo.track}
                  </span>
                  {goalLabel ? (
                    <span className="rounded-full border border-line bg-bg-soft px-3 py-1 text-sm text-ink-2">
                      Goal: {goalLabel}
                    </span>
                  ) : null}
                </div>

                <h2 className="mt-5 text-2xl font-bold text-ink">Skill level summary</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-2 sm:text-base">
                  {levelInfo.description}
                </p>

                <div className="mt-8 max-w-xl">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink-2">Overall accuracy</span>
                    <span className={cn('font-semibold tabular-nums', levelInfo.accentClass)}>
                      {accuracyPercent}%
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-line">
                    <div
                      className={cn('h-full rounded-full transition-all', levelInfo.barClass)}
                      style={{ width: `${submission.score}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-ink-3">
                    {correctCount} answered correctly · {incorrectCount} to review
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center border-t border-line bg-bg-soft px-6 py-10 lg:border-t-0">
                <p className="text-sm font-medium text-ink-2">Final score</p>
                <p
                  className={cn(
                    'mt-3 text-5xl font-bold tabular-nums tracking-tight sm:text-6xl',
                    levelInfo.accentClass,
                  )}
                >
                  {submission.score}%
                </p>
                <p className={cn('mt-2 text-lg font-semibold', levelInfo.accentClass)}>
                  {submission.level}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card">
            <div className="border-b border-line px-6 py-8 sm:px-10">
              <h2 className="text-2xl font-bold text-ink sm:text-3xl">Recommended learning path</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-ink-2 sm:text-base">
                Based on your {submission.score}% score, we recommend{' '}
                <span className="font-medium text-ink">{recommendedTitle}</span> — a{' '}
                {prefill.courseLevel}-level course in {prefill.category}.
              </p>
            </div>

            <ol className="divide-y divide-line lg:flex lg:divide-x lg:divide-y-0">
              {pathSteps.map((step, index) => (
                <li key={step.title} className="relative flex-1 px-6 py-6 sm:px-8 sm:py-8">
                  <span className="grid size-8 place-items-center rounded-lg border border-line bg-bg-soft text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-2">{step.description}</p>
                </li>
              ))}
            </ol>

            <div className="border-t border-line bg-bg-soft px-6 py-8 sm:px-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                  <div className="flex items-center gap-2 text-sm font-medium text-ink">
                    <Sparkles className="size-4 text-primary" />
                    Personalized course
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink-2">
                    Generate a course tailored to your {submission.level.toLowerCase()} level in{' '}
                    {prefill.category}. Your assessment results will inform module structure and
                    difficulty.
                  </p>
                </div>
                <CreateCourseFromRecommendation prefill={prefill} align="end" />
              </div>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card">
            <div className="border-b border-line px-6 py-5 sm:px-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-ink sm:text-2xl">Question breakdown</h2>
                  <p className="mt-1 text-sm text-ink-2">
                    Review each response. Results are private to your account.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-good/20 bg-good-soft px-3 py-1 font-medium text-good">
                    <Check className="size-3.5" />
                    {correctCount} correct
                  </span>
                  {incorrectCount > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-bad/20 bg-bad-soft px-3 py-1 font-medium text-bad">
                      <XCircle className="size-3.5" />
                      {incorrectCount} to review
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-6 sm:p-8 xl:grid-cols-2">
              {results.map((r) => {
                const q = questions[r.questionIndex];
                const given = (answers[r.questionIndex] ?? '').trim();
                return (
                  <article
                    key={r.questionIndex}
                    className={cn(
                      'rounded-xl border bg-bg p-5 sm:p-6',
                      r.correct ? 'border-good/25' : 'border-bad/25',
                    )}
                  >
                    <div className="flex items-start gap-3 border-b border-line pb-4">
                      <span
                        className={cn(
                          'grid size-9 shrink-0 place-items-center rounded-lg border',
                          r.correct
                            ? 'border-good/20 bg-good-soft text-good'
                            : 'border-bad/20 bg-bad-soft text-bad',
                        )}
                      >
                        {r.correct ? (
                          <CheckCircle2 className="size-4" />
                        ) : (
                          <XCircle className="size-4" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-ink-3">
                          Question {r.questionIndex + 1} of {results.length}
                        </p>
                        <h3 className="mt-2 text-base font-semibold leading-7 text-ink sm:text-lg">
                          {q?.question ?? 'Question'}
                        </h3>
                      </div>
                    </div>

                    {q?.options?.length ? (
                      <ul className="mt-4 space-y-2">
                        {q.options.map((opt, optIndex) => {
                          const label = OPTION_LABELS[optIndex] ?? String(optIndex + 1);
                          const isSelected = given === opt;
                          const isCorrect = r.correctAnswer === opt;
                          return (
                            <li
                              key={opt}
                              className={cn(
                                'flex items-start gap-3 rounded-lg border px-3.5 py-3 text-sm',
                                isCorrect && 'border-good/30 bg-good-soft/50',
                                isSelected && !isCorrect && 'border-bad/30 bg-bad-soft/50',
                                !isSelected && !isCorrect && 'border-line bg-bg-elev',
                              )}
                            >
                              <span
                                className={cn(
                                  'mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border text-xs font-semibold tabular-nums',
                                  isCorrect && 'border-good bg-good text-white',
                                  isSelected && !isCorrect && 'border-bad bg-bad text-white',
                                  !isSelected && !isCorrect && 'border-line bg-bg-soft text-ink-2',
                                )}
                              >
                                {label}
                              </span>
                              <span
                                className={cn(
                                  'leading-6',
                                  isCorrect || isSelected ? 'font-medium text-ink' : 'text-ink-2',
                                )}
                              >
                                {opt}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="mt-4 space-y-2 rounded-lg border border-line bg-bg-soft p-4 text-sm">
                        <p className="text-ink-2">
                          <span className="font-medium text-ink">Your answer:</span> {given || '—'}
                        </p>
                        {!r.correct ? (
                          <p className="text-ink-2">
                            <span className="font-medium text-good">Correct answer:</span>{' '}
                            {r.correctAnswer}
                          </p>
                        ) : null}
                      </div>
                    )}

                    {r.feedback?.trim() ? (
                      <p className="mt-4 rounded-lg border border-line bg-bg-soft px-4 py-3 text-sm leading-6 text-ink-2">
                        {r.feedback}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </Container>

      <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg-elev/95 backdrop-blur-sm">
        <Container>
          <div className="mx-auto flex max-w-6xl flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-2">
              {submission.level} level confirmed · {recommendedTitle}
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <Link href="/assessments">
                <Button variant="outline" size="lg" className="rounded-full px-5">
                  <ClipboardList className="size-4" />
                  All assessments
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="soft" size="lg" className="rounded-full px-5">
                  <BookOpen className="size-4" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/create-course">
                <Button size="lg" className="rounded-full px-6">
                  Continue learning
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}

export default SkillAssessmentResultView;
