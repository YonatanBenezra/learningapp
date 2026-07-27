'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Loader2, Send } from 'lucide-react';
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

  return (
    <div className="min-h-[calc(100vh-88px)] bg-gradient-to-b from-primary/[0.07] via-bg to-bg-soft/80 pb-28 pt-8 lg:pt-10">
      <Container className="max-w-[1240px]">
        <header className="overflow-hidden rounded-lg border border-line bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_8%,var(--bg-elev))_0%,var(--bg-elev)_55%)]">
          <div className="border-b border-line px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-3">
                  Skill assessment
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-[2rem]">
                  {topicLabel}
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-ink-2">
                  Answer all {questions.length} questions to receive your skill level and course
                  recommendation. Questions are presented in {totalPages} parts of {PAGE_SIZE}.
                </p>
              </div>

              <dl className="grid min-w-[300px] grid-cols-3 divide-x divide-line overflow-hidden rounded-lg border border-line bg-bg-soft/80 text-center">
                <StatItem label="Questions" value={String(questions.length)} />
                <StatItem label="Answered" value={String(answeredCount)} />
                <StatItem label="Progress" value={`${progressPercent}%`} />
              </dl>
            </div>
          </div>

          <div className="px-6 py-4 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-1.5">
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
                        'inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors',
                        active && 'border-ink bg-ink text-bg',
                        !active && done && 'border-line bg-bg-soft text-ink',
                        !active && !done && 'border-line bg-bg-elev text-ink-3',
                        step > page && 'cursor-not-allowed opacity-50',
                      )}
                    >
                      <span className="tabular-nums">{step + 1}.</span>
                      Part {step + 1}
                      {done && !active ? <Check className="size-3.5" /> : null}
                    </button>
                  );
                })}
              </div>

              <div className="min-w-[260px] flex-1 lg:max-w-sm">
                <div className="mb-2 flex items-center justify-between text-sm text-ink-3">
                  <span>
                    Part {page + 1} of {totalPages}
                  </span>
                  <span className="tabular-nums">
                    {answeredCount}/{questions.length} answered
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-lg bg-line/80">
                  <div
                    className="h-full bg-ink transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        <div ref={questionsRef} className="mt-6 grid gap-5 xl:grid-cols-2">
          {pageQuestions.map((q, offset) => {
            const i = startIndex + offset;
            const answered = Boolean(answers[i]?.trim());

            return (
              <article
                key={i}
                className={cn(
                  'rounded-lg border bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_4%,var(--bg-elev))_0%,var(--bg-elev)_100%)] p-5 sm:p-6',
                  answered ? 'border-ink/30' : 'border-line',
                )}
              >
                <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-ink-3">
                      Question {i + 1} of {questions.length}
                    </p>
                    <h2 className="mt-2 text-lg font-medium leading-8 text-ink sm:text-xl">
                      {q.question}
                    </h2>
                  </div>
                  {answered ? (
                    <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-ink-3">
                      Answered
                    </span>
                  ) : null}
                </div>

                {q.options ? (
                  <fieldset className="mt-5">
                    <legend className="sr-only">Select one answer</legend>
                    <div className="flex flex-col gap-2.5">
                      {q.options.map((opt, optIndex) => {
                        const selected = answers[i] === opt;
                        const label = OPTION_LABELS[optIndex] ?? String(optIndex + 1);
                        return (
                          <label
                            key={opt}
                            className={cn(
                              'flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3.5 transition-colors',
                              selected
                                ? 'border-ink bg-bg-soft/90'
                                : 'border-line bg-bg-elev/80 hover:border-ink/25 hover:bg-bg-soft/70',
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
                                'mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border text-xs font-semibold tabular-nums',
                                selected
                                  ? 'border-ink bg-ink text-bg'
                                  : 'border-line bg-bg-soft text-ink-2',
                              )}
                            >
                              {label}
                            </span>
                            <span
                              className={cn(
                                'text-base leading-7',
                                selected ? 'text-ink' : 'text-ink-2',
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
      </Container>

      <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg-elev/95 backdrop-blur-sm">
        <Container className="max-w-[1240px]">
          <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:py-4">
            <p className="text-base text-ink-2">
              {pageAnswered
                ? isLastPage
                  ? allAnswered
                    ? 'All questions answered. Submit to view your results.'
                    : 'Complete every question before submitting.'
                  : 'This section is complete. Continue to the next part.'
                : 'Select one answer for each question in this section.'}
            </p>

            <div className="flex items-center gap-2 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || submitting}
                className="min-w-[120px] rounded-lg"
              >
                <ArrowLeft className="size-4" />
                Previous
              </Button>

              <Button
                onClick={handleNext}
                disabled={!pageAnswered || submitting || (isLastPage && !allAnswered)}
                className="min-w-[152px] rounded-lg"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isLastPage ? (
                  <Send className="size-4" />
                ) : (
                  <ArrowRight className="size-4" />
                )}
                {isLastPage ? 'Submit assessment' : 'Next part'}
              </Button>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3.5">
      <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3">{label}</dt>
      <dd className="mt-1.5 text-xl font-semibold tabular-nums text-ink">{value}</dd>
    </div>
  );
}

export default PaginatedSkillAssessment;
