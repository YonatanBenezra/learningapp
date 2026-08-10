'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  Loader2,
  Send,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { Container } from '@/src/components/marketing/Container';
import { useAuthStore } from '@/src/store/authStore';
import type { AssessmentQuestion, SubmittedAnswer } from '@/src/domain/assessment';
import { pendingAnswersKey } from './skillAssessmentApi';

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
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const questionsRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.ceil(questions.length / PAGE_SIZE);
  const pageQuestions = useMemo(
    () => questions.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [questions, page],
  );
  const startIndex = page * PAGE_SIZE;
  const isLastPage = page === totalPages - 1;
  const answeredCount = questions.filter((_, i) => (answers[i] ?? '').trim() !== '').length;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);

  const pageAnswered = pageQuestions.every((_, i) => (answers[startIndex + i] ?? '').trim() !== '');
  const allAnswered = answeredCount === questions.length;

  const setAnswer = (index: number, value: string) =>
    setAnswers((prev) => ({ ...prev, [index]: value }));

  const buildAnswers = (): SubmittedAnswer[] =>
    questions.map((_, i) => ({ questionIndex: i, answer: answers[i] ?? '' }));

  const handleNext = () => {
    if (!pageAnswered) return;
    if (isLastPage) handleSubmit();
    else setPage((p) => p + 1);
  };

  useEffect(() => {
    questionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [page]);

  const handleSubmit = () => {
    if (!allAnswered || submitting) return;
    const payload = buildAnswers();
    if (!isAuthenticated) {
      sessionStorage.setItem(pendingAnswersKey(assessmentId), JSON.stringify(payload));
      router.push(`/login?redirect=${encodeURIComponent(`/assessment/${assessmentId}/result`)}`);
      return;
    }
    onSubmit(payload);
  };

  const footerHint = pageAnswered
    ? isLastPage
      ? allAnswered
        ? 'All questions answered. Submit to view your results.'
        : 'Complete every question before submitting.'
      : 'This section is complete. Continue to the next part.'
    : 'Select one answer for each question in this section.';

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-bg pb-28 pt-6 lg:pt-8">
      <Container>
        <div className="mx-auto max-w-6xl">
          <Link
            href="/assessments"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-2 transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            Back to assessments
          </Link>

          <header className="mt-5 overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card">
            <div className="border-b border-line bg-bg-soft/50 px-5 py-5 sm:px-8 sm:py-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    <Sparkles className="size-3.5" />
                    Skill assessment
                  </div>
                  <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                    {topicLabel}
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-ink-2 sm:text-base">
                    Answer all {questions.length} questions to receive your skill level and course
                    recommendation.
                  </p>
                </div>

                <dl className="grid min-w-full grid-cols-3 gap-3 sm:min-w-[320px] sm:gap-4">
                  <MetricCard label="Questions" value={String(questions.length)} />
                  <MetricCard label="Answered" value={String(answeredCount)} accent />
                  <MetricCard label="Progress" value={`${progressPercent}%`} />
                </dl>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-xs font-medium text-ink-2 sm:text-sm">
                  <span>
                    Section {page + 1} of {totalPages}
                  </span>
                  <span className="tabular-nums">
                    {answeredCount}/{questions.length} complete
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary-2 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 px-5 py-4 sm:px-8">
              {Array.from({ length: totalPages }, (_, step) => {
                const done = step < page || (step === page && pageAnswered);
                const active = step === page;
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => step <= page && setPage(step)}
                    disabled={step > page}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all',
                      active && 'border-primary bg-primary text-primary-ink shadow-xs',
                      !active && done && 'border-line bg-bg-soft text-ink hover:border-line-2',
                      !active && !done && 'border-line bg-bg-elev text-ink-3',
                      step > page && 'cursor-not-allowed opacity-45',
                    )}
                  >
                    Section {step + 1}
                    {done && !active ? <Check className="size-3.5" /> : null}
                  </button>
                );
              })}
            </div>
          </header>

          <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-2xl border border-line bg-bg-elev p-4 shadow-card">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-3">
                  Question map
                </p>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {questions.map((_, index) => {
                    const answered = Boolean(answers[index]?.trim());
                    const onCurrentPage =
                      index >= startIndex && index < startIndex + pageQuestions.length;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          const targetPage = Math.floor(index / PAGE_SIZE);
                          if (targetPage <= page) setPage(targetPage);
                        }}
                        disabled={Math.floor(index / PAGE_SIZE) > page}
                        className={cn(
                          'grid size-9 place-items-center rounded-lg border text-xs font-semibold tabular-nums transition-colors',
                          onCurrentPage && 'border-primary bg-primary text-primary-ink',
                          !onCurrentPage && answered && 'border-good/30 bg-good-soft text-good',
                          !onCurrentPage && !answered && 'border-line bg-bg-soft text-ink-2',
                          Math.floor(index / PAGE_SIZE) > page && 'opacity-40',
                        )}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 flex items-center gap-2 text-xs text-ink-3">
                  <ClipboardList className="size-3.5" />
                  {PAGE_SIZE} questions per section
                </p>
              </div>
            </aside>

            <div ref={questionsRef} className="space-y-5">
              {pageQuestions.map((q, offset) => {
                const i = startIndex + offset;
                const answered = Boolean(answers[i]?.trim());

                return (
                  <article
                    key={i}
                    className={cn(
                      'overflow-hidden rounded-2xl border bg-bg-elev shadow-card transition-colors',
                      answered ? 'border-primary/35 ring-1 ring-primary/10' : 'border-line',
                    )}
                  >
                    <div className="border-b border-line bg-bg-soft/40 px-5 py-4 sm:px-6">
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                        Question {i + 1}
                      </p>
                      <h2 className="mt-2 text-lg font-semibold leading-8 text-ink sm:text-xl">
                        {q.question}
                      </h2>
                    </div>

                    {q.options ? (
                      <fieldset className="px-5 py-5 sm:px-6 sm:py-6">
                        <legend className="sr-only">Select one answer</legend>
                        <div className="flex flex-col gap-2.5">
                          {q.options.map((opt, optIndex) => {
                            const selected = answers[i] === opt;
                            const label = OPTION_LABELS[optIndex] ?? String(optIndex + 1);
                            return (
                              <label
                                key={opt}
                                className={cn(
                                  'flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition-all',
                                  selected
                                    ? 'border-primary bg-primary/[0.05] shadow-xs ring-1 ring-primary/15'
                                    : 'border-line bg-bg hover:border-line-2 hover:bg-bg-soft',
                                )}
                              >
                                <input
                                  type="radio"
                                  name={`q-${i}`}
                                  className="sr-only"
                                  checked={selected}
                                  onChange={() => setAnswer(i, opt)}
                                />
                                <span
                                  className={cn(
                                    'mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border text-xs font-bold tabular-nums',
                                    selected
                                      ? 'border-primary bg-primary text-primary-ink'
                                      : 'border-line bg-bg-elev text-ink-2',
                                  )}
                                >
                                  {label}
                                </span>
                                <span
                                  className={cn(
                                    'text-sm leading-7 sm:text-base',
                                    selected ? 'font-medium text-ink' : 'text-ink-2',
                                  )}
                                >
                                  {opt}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </Container>

      <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg-elev/95 shadow-[0_-8px_30px_color-mix(in_srgb,var(--ink)_6%,transparent)] backdrop-blur-md">
        <Container>
          <div className="mx-auto flex max-w-6xl flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-2">{footerHint}</p>

            <div className="flex items-center gap-2 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || submitting}
                className="rounded-xl px-5"
              >
                <ArrowLeft className="size-4" />
                Previous
              </Button>

              <Button
                onClick={handleNext}
                disabled={!pageAnswered || submitting || (isLastPage && !allAnswered)}
                className="rounded-xl px-6 shadow-primary"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isLastPage ? (
                  <Send className="size-4" />
                ) : (
                  <ArrowRight className="size-4" />
                )}
                {isLastPage ? 'Submit assessment' : 'Continue'}
              </Button>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-bg-elev px-3 py-3 text-center sm:px-4 sm:py-3.5">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-3 sm:text-xs">
        {label}
      </dt>
      <dd
        className={cn(
          'mt-1 text-lg font-bold tabular-nums sm:text-xl',
          accent ? 'text-primary' : 'text-ink',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export default PaginatedSkillAssessment;
