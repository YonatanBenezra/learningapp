'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Loader2, Send } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { buttonClasses } from '@/src/components/ui/button';
import { Container } from '@/src/components/marketing/Container';
import type { AssessmentQuestion, SubmittedAnswer } from '@/src/domain/assessment';
import { useTranslation, useIsRtl } from '@/src/i18n';

const PAGE_SIZE = 2;
const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function PaginatedSkillAssessment({
  assessmentId,
  topicLabel,
  questions,
  submitting,
  onSubmit,
}: {
  assessmentId: string;
  topicLabel: string;
  questions: AssessmentQuestion[];
  submitting: boolean;
  onSubmit: (answers: SubmittedAnswer[]) => void;
}) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const questionsRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.ceil(questions.length / PAGE_SIZE);
  const pageQuestions = useMemo(
    () => questions.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [questions, page],
  );
  const startIndex = page * PAGE_SIZE;
  const endIndex = startIndex + pageQuestions.length;
  const isLastPage = page === totalPages - 1;
  const answeredCount = questions.filter((_, i) => (answers[i] ?? '').trim() !== '').length;
  const allAnswered = answeredCount === questions.length;
  const pageAnswered = pageQuestions.every((_, offset) => (answers[startIndex + offset] ?? '').trim() !== '');

  const setAnswer = (index: number, value: string) =>
    setAnswers((prev) => ({ ...prev, [index]: value }));

  const buildAnswers = (): SubmittedAnswer[] =>
    questions.map((_, i) => ({ questionIndex: i, answer: answers[i] ?? '' }));

  const handleSubmit = () => {
    if (!allAnswered || submitting) return;
    onSubmit(buildAnswers());
  };

  const handleNext = () => {
    if (!pageAnswered) return;
    if (isLastPage) handleSubmit();
    else setPage((value) => value + 1);
  };

  useEffect(() => {
    questionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [page]);

  const footerHint = pageAnswered
    ? isLastPage
      ? allAnswered
        ? t('marketing.assessHintSubmitReady')
        : t('marketing.assessHintCompleteAll')
      : t('marketing.assessHintSectionComplete')
    : t('marketing.assessHintSelectAnswer');

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
              {t('marketing.assessQuestionN', { n: `${startIndex + 1}–${endIndex}` })}
              <span className="text-ink/30"> / {questions.length}</span>
            </p>
          </div>

          <p className="mt-8 text-sm font-medium text-ink/45">{topicLabel}</p>

          <div ref={questionsRef} className="mt-6 space-y-12">
            {pageQuestions.map((question, offset) => {
              const questionIndex = startIndex + offset;
              return (
                <QuestionBlock
                  key={questionIndex}
                  question={question}
                  questionIndex={questionIndex}
                  answer={answers[questionIndex] ?? ''}
                  onAnswer={(value) => setAnswer(questionIndex, value)}
                />
              );
            })}
          </div>
        </div>
      </Container>

      <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-[var(--marketing-hero)]/95 backdrop-blur-md">
        <Container>
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink/55">{footerHint}</p>
            <div className="flex items-center gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(0, value - 1))}
                disabled={page === 0 || submitting}
                className={buttonClasses({
                  variant: 'outline',
                  className: 'h-11 rounded-md bg-transparent px-5 text-sm font-medium',
                })}
              >
                <ArrowLeft className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
                {t('marketing.assessPrevious')}
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!pageAnswered || submitting || (isLastPage && !allAnswered)}
                className={buttonClasses({
                  size: 'lg',
                  className: 'h-11 rounded-md px-5 text-sm font-medium shadow-none',
                })}
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isLastPage ? (
                  <Send className="size-4" />
                ) : (
                  <ArrowRight className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
                )}
                {isLastPage ? t('marketing.assessSubmit') : t('marketing.assessContinue')}
              </button>
            </div>
          </div>
        </Container>
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

      {question.options ? (
        <fieldset className="mt-6">
          <legend className="sr-only">{t('marketing.assessSelectOneAnswer')}</legend>
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
          placeholder={t('marketing.assessSelectOneAnswer')}
          className="mt-6 min-h-32 w-full rounded-md border border-line/80 bg-bg-elev/90 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink/40 focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
      )}
    </article>
  );
}

export default PaginatedSkillAssessment;
