'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { buttonClasses } from '@/src/components/ui/button';
import { Container } from '@/src/components/marketing/Container';
import { CreateCourseFromRecommendation } from '@/src/features/learning-path/CreateCourseFromRecommendation';
import {
  getLearningPathSteps,
  getRecommendedCourseTitle,
  type LearningPathPrefill,
} from '@/src/features/learning-path/learningPathRecommendation';
import type {
  AssessmentQuestion,
  GradedResult,
  SkillAssessmentSubmission,
} from '@/src/domain/assessment';
import { cn } from '@/src/lib/utils';
import { MVP_PRACTICE_MODE, PRACTICE_PATH } from '@/src/config/mvp';
import {
  useTranslation,
  useSkillLevelCopy,
  useGoalLabel,
  useCategoryLabel,
  useCourseLevelLabel,
  useIsRtl,
} from '@/src/i18n';

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function SkillAssessmentResultView({
  topicLabel,
  questions,
  submission,
  answers,
  prefill,
  practiceHref = PRACTICE_PATH,
}: {
  topicLabel: string;
  questions: AssessmentQuestion[];
  submission: SkillAssessmentSubmission;
  answers: Record<number, string>;
  prefill: LearningPathPrefill;
  practiceHref?: string;
}) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const levelCopy = useSkillLevelCopy(submission.level);
  const categoryLabel = useCategoryLabel(prefill.category);
  const courseLevelLabel = useCourseLevelLabel(prefill.courseLevel);
  const results = [...submission.results].sort((a, b) => a.questionIndex - b.questionIndex);
  const correctCount = results.filter((r) => r.correct).length;
  const incorrectCount = results.length - correctCount;
  const pathSteps = getLearningPathSteps(prefill);
  const recommendedTitle = getRecommendedCourseTitle(prefill);
  const goalLabel = useGoalLabel(prefill.goal);

  return (
    <section className="flex min-h-full flex-1 flex-col bg-[var(--marketing-hero)] pt-6 pb-28 lg:pt-8">
      <Container>
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/assessments"
              className="inline-flex items-center gap-2 text-sm font-medium text-ink/55 transition-colors hover:text-ink"
            >
              <ArrowLeft className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
              {t('marketing.assessBackToAssessments')}
            </Link>
            <p className="text-sm font-medium tabular-nums text-ink/55">
              {t('marketing.assessResultScore')} {submission.score}%
              <span className="text-ink/30">
                {' '}
                · {correctCount}/{results.length}
              </span>
            </p>
          </div>

          <p className="mt-8 text-sm font-medium text-ink/45">{topicLabel}</p>

          <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-2">
            <p className="font-heading text-5xl font-medium leading-none tabular-nums tracking-[-0.04em] text-primary sm:text-6xl">
              {submission.score}%
            </p>
            <div className="pb-1">
              <p className="text-lg font-medium text-ink">{levelCopy.level}</p>
              {goalLabel ? (
                <p className="mt-0.5 text-sm text-ink/55">
                  {t('marketing.assessResultGoal', { goal: goalLabel })}
                </p>
              ) : (
                <p className="mt-0.5 text-sm text-ink/55">{levelCopy.track}</p>
              )}
            </div>
          </div>

          <p className="mt-5 max-w-2xl text-base leading-7 text-ink/70">{levelCopy.description}</p>

          <section className="mt-14 border-t border-line/70 pt-10">
            <h2 className="font-heading text-[1.45rem] font-medium tracking-[-0.02em] text-ink sm:text-[1.75rem]">
              {t('marketing.assessResultRecommendedPath')}
            </h2>
            <p className="mt-3 text-sm leading-7 text-ink/70 sm:text-base">
              {t('marketing.assessResultRecommendDesc', {
                score: String(submission.score),
                title: recommendedTitle,
                courseLevel: courseLevelLabel,
                category: categoryLabel,
              })}
            </p>

            <ol className="mt-8 space-y-8">
              {pathSteps.map((step, index) => (
                <li key={step.title} className="flex gap-5 sm:gap-6">
                  <span className="font-heading text-3xl font-medium leading-none tabular-nums text-primary/80 sm:text-4xl">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="font-heading text-lg font-medium text-ink">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-ink/65">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-md">
                <p className="text-sm font-medium text-ink">{t('marketing.assessResultPersonalizedCourse')}</p>
                <p className="mt-1.5 text-sm leading-6 text-ink/65">
                  {t('marketing.assessResultPersonalizedDesc', {
                    level: levelCopy.level,
                    category: categoryLabel,
                  })}
                </p>
              </div>
              <CreateCourseFromRecommendation prefill={prefill} align="end" />
            </div>
          </section>

          <section className="mt-14 border-t border-line/70 pt-10">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="font-heading text-[1.45rem] font-medium tracking-[-0.02em] text-ink sm:text-[1.75rem]">
                {t('marketing.assessResultBreakdown')}
              </h2>
              <p className="text-sm text-ink/45">
                {t('marketing.assessResultCorrectBadge', { count: String(correctCount) })}
                {incorrectCount > 0
                  ? ` · ${t('marketing.assessResultReviewBadge', { count: String(incorrectCount) })}`
                  : ''}
              </p>
            </div>
            <p className="mt-2 text-sm leading-6 text-ink/65">{t('marketing.assessResultBreakdownDesc')}</p>

            <div className="mt-10 space-y-14">
              {results.map((result) => {
                const question = questions[result.questionIndex];
                return (
                  <ReviewQuestion
                    key={result.questionIndex}
                    question={question}
                    result={result}
                    given={(answers[result.questionIndex] ?? '').trim()}
                  />
                );
              })}
            </div>
          </section>
        </div>
      </Container>

      <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-[var(--marketing-hero)]/95 backdrop-blur-md">
        <Container>
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink/55">
              {t('marketing.assessResultFooter', {
                level: levelCopy.level,
                title: recommendedTitle,
              })}
            </p>
            <div className="flex items-center gap-2 sm:justify-end">
              {MVP_PRACTICE_MODE ? (
                <Link
                  href={practiceHref}
                  className={buttonClasses({
                    size: 'lg',
                    className: 'h-11 rounded-md px-5 text-sm font-medium shadow-none',
                  })}
                >
                  {t('marketing.startPracticing')}
                  <ArrowRight className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
                </Link>
              ) : null}
              <Link
                href="/assessments"
                className={buttonClasses({
                  variant: 'outline',
                  className: 'h-11 rounded-md bg-transparent px-5 text-sm font-medium',
                })}
              >
                {t('marketing.assessResultAllAssessments')}
              </Link>
              {!MVP_PRACTICE_MODE ? (
                <Link
                  href="/create-course"
                  className={buttonClasses({
                    size: 'lg',
                    className: 'h-11 rounded-md px-5 text-sm font-medium shadow-none',
                  })}
                >
                  {t('marketing.assessResultContinueLearning')}
                  <ArrowRight className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
                </Link>
              ) : null}
            </div>
          </div>
        </Container>
      </footer>
    </section>
  );
}

function ReviewQuestion({
  question,
  result,
  given,
}: {
  question: AssessmentQuestion | undefined;
  result: GradedResult;
  given: string;
}) {
  const { t } = useTranslation();

  return (
    <article>
      <div className="flex gap-5 sm:gap-6">
        <span
          className={cn(
            'font-heading text-4xl font-medium leading-none tabular-nums sm:text-5xl',
            result.correct ? 'text-primary/80' : 'text-bad/80',
          )}
        >
          {String(result.questionIndex + 1).padStart(2, '0')}
        </span>
        <h3 className="font-heading text-[1.45rem] font-medium leading-snug tracking-[-0.02em] text-ink sm:text-[1.75rem]">
          {question?.question ?? t('marketing.assessResultQuestionFallback')}
        </h3>
      </div>

      {question?.options?.length ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {question.options.map((opt, optIndex) => {
            const label = OPTION_LABELS[optIndex] ?? String(optIndex + 1);
            const isSelected = given === opt;
            const isCorrect = result.correctAnswer === opt;
            return (
              <li
                key={opt}
                className={cn(
                  'flex min-h-[5.25rem] items-start gap-3.5 rounded-md border px-4 py-4',
                  isCorrect && 'border-good/40 bg-good-soft/40',
                  isSelected && !isCorrect && 'border-bad/40 bg-bad-soft/40',
                  !isSelected && !isCorrect && 'border-line/80 bg-bg-elev/80',
                )}
              >
                <span
                  className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-full text-sm font-medium tabular-nums',
                    isCorrect && 'bg-good text-white',
                    isSelected && !isCorrect && 'bg-bad text-white',
                    !isSelected && !isCorrect && 'bg-bg-soft text-ink/55',
                  )}
                >
                  {label}
                </span>
                <span
                  className={cn(
                    'flex-1 pt-1 text-sm leading-6 sm:text-[15px]',
                    isCorrect || isSelected ? 'font-medium text-ink' : 'text-ink/75',
                  )}
                >
                  {opt}
                </span>
                <span
                  className={cn(
                    'mt-1 grid size-5 shrink-0 place-items-center rounded-full border',
                    isCorrect && 'border-good bg-good text-white',
                    isSelected && !isCorrect && 'border-bad bg-bad text-white',
                    !isSelected && !isCorrect && 'border-line-2 text-transparent',
                  )}
                >
                  {isCorrect ? (
                    <Check className="size-3" strokeWidth={3} />
                  ) : isSelected ? (
                    <X className="size-3" strokeWidth={3} />
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-6 space-y-2 rounded-md border border-line/80 bg-bg-elev/80 px-4 py-4 text-sm">
          <p className="text-ink/70">
            <span className="font-medium text-ink">{t('marketing.assessResultYourAnswer')}</span>{' '}
            {given || '—'}
          </p>
          {!result.correct ? (
            <p className="text-ink/70">
              <span className="font-medium text-good">{t('marketing.assessResultCorrectAnswer')}</span>{' '}
              {result.correctAnswer}
            </p>
          ) : null}
        </div>
      )}

      {result.feedback?.trim() ? (
        <p className="mt-4 text-sm leading-6 text-ink/65">{result.feedback}</p>
      ) : null}
    </article>
  );
}

export default SkillAssessmentResultView;
