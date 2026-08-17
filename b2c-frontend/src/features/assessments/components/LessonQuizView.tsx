'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Loader2,
  RefreshCw,
  Send,
  X,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { buttonClasses } from '@/src/components/ui/button';
import { Skeleton } from '@/src/components/ui/skeleton';
import { useSidebar } from '@/src/components/layout/Sidebar';
import { useIsRtl, useTranslation } from '@/src/i18n';
import type {
  AssessmentQuestion,
  AssessmentSubmission,
  SubmittedAnswer,
} from '@/src/domain/assessment';

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function LessonQuizView({
  title,
  questions,
  submission,
  submitting,
  submitError,
  onSubmit,
  backHref,
  backLabel,
  onRetake,
  retaking,
}: {
  title: string;
  questions: AssessmentQuestion[];
  submission: AssessmentSubmission | null;
  submitting: boolean;
  submitError?: string | null;
  onSubmit: (answers: SubmittedAnswer[]) => void;
  backHref: string;
  backLabel: string;
  onRetake?: () => void;
  retaking?: boolean;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});

  if (submission) {
    return (
      <QuizResult
        title={title}
        questions={questions}
        submission={submission}
        answers={answers}
        backHref={backHref}
        backLabel={backLabel}
        onRetake={onRetake}
        retaking={retaking}
      />
    );
  }

  return (
    <QuizTake
      title={title}
      questions={questions}
      answers={answers}
      onAnswer={(index, value) => setAnswers((current) => ({ ...current, [index]: value }))}
      submitting={submitting}
      submitError={submitError}
      onSubmit={onSubmit}
      backHref={backHref}
      backLabel={backLabel}
    />
  );
}

function QuizTake({
  title,
  questions,
  answers,
  onAnswer,
  submitting,
  submitError,
  onSubmit,
  backHref,
  backLabel,
}: {
  title: string;
  questions: AssessmentQuestion[];
  answers: Record<number, string>;
  onAnswer: (index: number, value: string) => void;
  submitting: boolean;
  submitError?: string | null;
  onSubmit: (answers: SubmittedAnswer[]) => void;
  backHref: string;
  backLabel: string;
}) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const { collapsed } = useSidebar();
  const answeredCount = questions.filter((_, index) => (answers[index] ?? '').trim() !== '').length;
  const allAnswered = answeredCount === questions.length;

  return (
    <section className="flex min-h-full flex-1 flex-col bg-[var(--marketing-hero)] pt-6 pb-28 lg:pt-8">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-ink/55 transition-colors hover:text-ink"
          >
            <ArrowLeft className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
            {backLabel}
          </Link>
          <p className="text-sm font-medium tabular-nums text-ink/55">
            {t('assessmentRunner.questionsAnswered', {
              total: String(questions.length),
              answered: String(answeredCount),
            })}
          </p>
        </div>

        <p className="mt-8 text-sm font-medium text-ink/45">{t('assessmentRunner.lessonQuiz')}</p>
        <h1 className="mt-3 font-heading text-[1.85rem] font-medium leading-tight tracking-[-0.03em] text-ink sm:text-[2.15rem]">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
          {t('assessmentRunner.quizInstructions')}
        </p>

        <div className="mt-12 space-y-14">
          {questions.map((question, index) => (
            <QuestionBlock
              key={index}
              question={question}
              questionIndex={index}
              answer={answers[index] ?? ''}
              onAnswer={(value) => onAnswer(index, value)}
            />
          ))}
        </div>
      </div>

      <footer
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-[var(--marketing-hero)]/95 backdrop-blur-md',
          collapsed ? 'lg:left-[72px]' : 'lg:left-[260px]',
        )}
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="text-sm text-ink/55">
            {submitError
              ? submitError
              : allAnswered
                ? t('assessmentRunner.allAnswered')
                : t('assessmentRunner.answerAllBeforeSubmit', { count: String(questions.length) })}
          </p>
          <button
            type="button"
            onClick={() =>
              onSubmit(questions.map((_, index) => ({ questionIndex: index, answer: answers[index] ?? '' })))
            }
            disabled={submitting || !allAnswered}
            className={buttonClasses({
              size: 'lg',
              className: 'h-11 rounded-md px-5 text-sm font-medium shadow-none',
            })}
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {t('assessmentRunner.submitQuiz')}
          </button>
        </div>
      </footer>
    </section>
  );
}

function QuestionBlock({
  question,
  questionIndex,
  answer,
  onAnswer,
}: {
  question: AssessmentQuestion;
  questionIndex: number;
  answer: string;
  onAnswer: (value: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <article>
      <div className="flex gap-5 sm:gap-6">
        <span className="font-heading text-4xl font-medium leading-none tabular-nums text-primary/80 sm:text-5xl">
          {String(questionIndex + 1).padStart(2, '0')}
        </span>
        <h2 className="font-heading text-[1.45rem] font-medium leading-snug tracking-[-0.02em] text-ink sm:text-[1.75rem]">
          {question.question}
        </h2>
      </div>

      {question.type === 'mcq' && question.options ? (
        <fieldset className="mt-6">
          <legend className="sr-only">{question.question}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {question.options.map((opt, optIndex) => {
              const selected = answer === opt;
              const label = OPTION_LABELS[optIndex] ?? String(optIndex + 1);
              return (
                <label
                  key={opt}
                  className={cn(
                    'group relative flex min-h-[5.25rem] cursor-pointer items-start gap-3.5 rounded-md border px-4 py-4 transition-colors',
                    selected
                      ? 'border-primary bg-primary/[0.07]'
                      : 'border-line/80 bg-bg-elev/80 hover:border-primary/40 hover:bg-bg-elev',
                  )}
                >
                  <input
                    type="radio"
                    name={`q-${questionIndex}`}
                    className="sr-only"
                    checked={selected}
                    onChange={() => onAnswer(opt)}
                  />
                  <span
                    className={cn(
                      'grid size-9 shrink-0 place-items-center rounded-full text-sm font-medium tabular-nums transition-colors',
                      selected
                        ? 'bg-primary text-primary-ink'
                        : 'bg-bg-soft text-ink/55 group-hover:text-ink',
                    )}
                  >
                    {label}
                  </span>
                  <span
                    className={cn(
                      'flex-1 pt-1 text-sm leading-6 sm:text-[15px]',
                      selected ? 'font-medium text-ink' : 'text-ink/75',
                    )}
                  >
                    {opt}
                  </span>
                  <span
                    className={cn(
                      'mt-1 grid size-5 shrink-0 place-items-center rounded-full border transition-colors',
                      selected
                        ? 'border-primary bg-primary text-primary-ink'
                        : 'border-line-2 text-transparent',
                    )}
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : (
        <textarea
          value={answer}
          onChange={(event) => onAnswer(event.target.value)}
          placeholder={t('assessmentRunner.writeAnswerPlaceholder')}
          className="mt-6 min-h-32 w-full rounded-md border border-line/80 bg-bg-elev/90 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink/40 focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
      )}
    </article>
  );
}

function QuizResult({
  title,
  questions,
  submission,
  answers,
  backHref,
  backLabel,
  onRetake,
  retaking,
}: {
  title: string;
  questions: AssessmentQuestion[];
  submission: AssessmentSubmission;
  answers: Record<number, string>;
  backHref: string;
  backLabel: string;
  onRetake?: () => void;
  retaking?: boolean;
}) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const { collapsed } = useSidebar();
  const results = [...submission.results].sort((a, b) => a.questionIndex - b.questionIndex);
  const correctCount = results.filter((result) => result.correct).length;
  const incorrectCount = results.length - correctCount;

  return (
    <section className="flex min-h-full flex-1 flex-col bg-[var(--marketing-hero)] pt-6 pb-28 lg:pt-8">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
          {backLabel}
        </Link>

        <p className="mt-8 text-sm font-medium text-ink/45">{t('assessmentRunner.lessonQuiz')}</p>
        <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-2">
          <p className="font-heading text-5xl font-medium leading-none tabular-nums tracking-[-0.04em] text-primary sm:text-6xl">
            {submission.score}%
          </p>
          <div className="pb-1">
            <p className="text-lg font-medium text-ink">{title}</p>
            <p className="mt-0.5 text-sm text-ink/55">
              {t('assessmentRunner.correctOfTotal', {
                correct: String(correctCount),
                total: String(results.length),
              })}
            </p>
          </div>
        </div>

        <div className="mt-5 h-1.5 max-w-xs overflow-hidden rounded-full bg-primary/15">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${Math.max(0, Math.min(100, submission.score))}%` }}
          />
        </div>

        <section className="mt-14 border-t border-line/70 pt-10">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-heading text-[1.45rem] font-medium tracking-[-0.02em] text-ink sm:text-[1.75rem]">
              {t('assessmentRunner.result', { type: t('assessmentRunner.lessonQuiz') })}
            </h2>
            <p className="text-sm text-ink/45">
              {correctCount}/{results.length}
              {incorrectCount > 0 ? ` · ${incorrectCount}` : ''}
            </p>
          </div>

          <div className="mt-10 space-y-14">
            {results.map((result) => (
              <ReviewQuestion
                key={result.questionIndex}
                question={questions[result.questionIndex]}
                questionIndex={result.questionIndex}
                correct={result.correct}
                correctAnswer={result.correctAnswer}
                feedback={result.feedback}
                given={(answers[result.questionIndex] ?? '').trim()}
              />
            ))}
          </div>
        </section>
      </div>

      <footer
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-[var(--marketing-hero)]/95 backdrop-blur-md',
          collapsed ? 'lg:left-[72px]' : 'lg:left-[260px]',
        )}
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="text-sm text-ink/55">{backLabel}</p>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Link
              href="/quizzes"
              className={buttonClasses({
                variant: 'outline',
                className: 'h-11 rounded-md bg-transparent px-5 text-sm font-medium',
              })}
            >
              {t('assessmentRunner.quizHistory')}
            </Link>
            {onRetake ? (
              <button
                type="button"
                onClick={onRetake}
                disabled={retaking}
                className={buttonClasses({
                  size: 'lg',
                  className: 'h-11 rounded-md px-5 text-sm font-medium shadow-none',
                })}
              >
                {retaking ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                {t('assessmentRunner.tryAnotherQuiz')}
              </button>
            ) : (
              <Link
                href={backHref}
                className={buttonClasses({
                  size: 'lg',
                  className: 'h-11 rounded-md px-5 text-sm font-medium shadow-none',
                })}
              >
                {backLabel}
              </Link>
            )}
          </div>
        </div>
      </footer>
    </section>
  );
}

function ReviewQuestion({
  question,
  questionIndex,
  correct,
  correctAnswer,
  feedback,
  given,
}: {
  question: AssessmentQuestion | undefined;
  questionIndex: number;
  correct: boolean;
  correctAnswer: string;
  feedback?: string | null;
  given: string;
}) {
  const { t } = useTranslation();

  return (
    <article>
      <div className="flex gap-5 sm:gap-6">
        <span
          className={cn(
            'font-heading text-4xl font-medium leading-none tabular-nums sm:text-5xl',
            correct ? 'text-primary/80' : 'text-bad/80',
          )}
        >
          {String(questionIndex + 1).padStart(2, '0')}
        </span>
        <h3 className="font-heading text-[1.45rem] font-medium leading-snug tracking-[-0.02em] text-ink sm:text-[1.75rem]">
          {question?.question ?? t('assessmentRunner.question')}
        </h3>
      </div>

      {question?.options?.length ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {question.options.map((opt, optIndex) => {
            const label = OPTION_LABELS[optIndex] ?? String(optIndex + 1);
            const isSelected = given === opt;
            const isCorrect = correctAnswer === opt;
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
            <span className="font-medium text-ink">{t('assessmentRunner.yourAnswer')} </span>
            {given || '—'}
          </p>
          {!correct ? (
            <p className="text-ink/70">
              <span className="font-medium text-ink">{t('assessmentRunner.correctAnswer')} </span>
              {correctAnswer}
            </p>
          ) : null}
        </div>
      )}

      {feedback?.trim() ? (
        <p className="mt-4 text-sm leading-6 text-ink/65">{feedback}</p>
      ) : null}
    </article>
  );
}

export function LessonQuizLoading() {
  return (
    <section className="flex min-h-full flex-1 flex-col bg-[var(--marketing-hero)] pt-6 pb-16 lg:pt-8">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-4 w-32" shimmer />
        <Skeleton className="mt-8 h-4 w-28" shimmer />
        <Skeleton className="mt-3 h-10 w-72 max-w-full" shimmer />
        <div className="mt-12 space-y-10">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index}>
              <Skeleton className="h-10 w-16" shimmer />
              <Skeleton className="mt-4 h-8 w-full max-w-xl" shimmer />
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-20 rounded-md" shimmer />
                <Skeleton className="h-20 rounded-md" shimmer />
                <Skeleton className="h-20 rounded-md" shimmer />
                <Skeleton className="h-20 rounded-md" shimmer />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LessonQuizError({
  backHref,
  backLabel,
  label,
}: {
  backHref: string;
  backLabel: string;
  label: string;
}) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();

  return (
    <section className="flex min-h-full flex-1 flex-col bg-[var(--marketing-hero)] pt-6 pb-16 lg:pt-8">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
          {backLabel}
        </Link>
        <div className="mx-auto mt-20 max-w-md text-center">
          <h1 className="font-heading text-xl font-medium tracking-[-0.02em] text-ink">{label}</h1>
          <p className="mt-2 text-sm leading-6 text-ink/65">{t('player.linkWrong')}</p>
        </div>
      </div>
    </section>
  );
}
