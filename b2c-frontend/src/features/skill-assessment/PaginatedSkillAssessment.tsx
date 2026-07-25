'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Send,
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
  const token = useAuthStore((s) => s.accessToken);
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
    if (!token) {
      sessionStorage.setItem(pendingAnswersKey(assessmentId), JSON.stringify(payload));
      router.push(`/login?redirect=${encodeURIComponent(`/assessment/${assessmentId}/result`)}`);
      return;
    }
    onSubmit(payload);
  };

  return (
    <div className="pb-32 pt-8 lg:pt-12">
      <Container className="max-w-[1240px]">
        <div className="overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-lift">
          <div className="border-b border-line bg-[linear-gradient(90deg,color-mix(in_srgb,var(--primary)_10%,transparent)_0%,transparent_55%)] px-6 py-6 sm:px-8 sm:py-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  <ClipboardList className="size-3.5" />
                  Skill assessment
                </div>
                <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  {topicLabel}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2 sm:text-base">
                  Complete all {questions.length} questions to receive your skill level and a
                  personalized course recommendation. Responses are shown two at a time for clarity.
                </p>
              </div>

              <div className="grid min-w-[220px] grid-cols-3 gap-3 sm:gap-4">
                <StatCard label="Questions" value={String(questions.length)} />
                <StatCard label="Answered" value={String(answeredCount)} accent />
                <StatCard label="Progress" value={`${progressPercent}%`} />
              </div>
            </div>
          </div>

          <div className="border-b border-line px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
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
                        'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition',
                        active && 'border-primary bg-primary text-white shadow-[var(--shadow-primary)]',
                        !active && done && 'border-primary/20 bg-primary-soft text-primary',
                        !active && !done && 'border-line bg-bg-soft text-ink-3',
                        step > page && 'cursor-not-allowed opacity-60',
                      )}
                    >
                      <span
                        className={cn(
                          'grid size-5 place-items-center rounded-md text-[11px] font-bold',
                          active ? 'bg-white/15 text-white' : 'bg-bg-elev text-ink-3',
                        )}
                      >
                        {step + 1}
                      </span>
                      Part {step + 1}
                    </button>
                  );
                })}
              </div>

              <div className="min-w-[240px] flex-1 lg:max-w-md">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-ink-2">
                    Part {page + 1} of {totalPages}
                  </span>
                  <span className="text-ink-3">
                    {answeredCount}/{questions.length} complete
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-line/80">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div ref={questionsRef} className="mt-8 grid gap-6 xl:grid-cols-2">
          {pageQuestions.map((q, offset) => {
            const i = startIndex + offset;
            const answered = Boolean(answers[i]?.trim());

            return (
              <article
                key={i}
                className={cn(
                  'rounded-2xl border bg-bg-elev p-6 shadow-card transition-shadow sm:p-7',
                  answered ? 'border-primary/30' : 'border-line',
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary-soft text-base font-bold text-primary">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">
                        Question {i + 1}
                      </p>
                      <h2 className="mt-2 text-base font-semibold leading-7 text-ink sm:text-lg">
                        {q.question}
                      </h2>
                    </div>
                  </div>
                  {answered ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-good/20 bg-good-soft px-2.5 py-1 text-xs font-semibold text-good">
                      <CheckCircle2 className="size-3.5" />
                      Answered
                    </span>
                  ) : null}
                </div>

                {q.options ? (
                  <div className="mt-6 flex flex-col gap-2.5">
                    {q.options.map((opt, optIndex) => {
                      const selected = answers[i] === opt;
                      const label = OPTION_LABELS[optIndex] ?? String(optIndex + 1);
                      return (
                        <label
                          key={opt}
                          className={cn(
                            'group flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors',
                            selected
                              ? 'border-primary bg-primary-soft/60'
                              : 'border-line bg-bg-soft hover:border-primary/30 hover:bg-bg-elev',
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
                              'grid size-9 shrink-0 place-items-center rounded-lg text-sm font-bold transition-colors',
                              selected
                                ? 'bg-primary text-white'
                                : 'border border-line bg-bg-elev text-primary group-hover:border-primary/30',
                            )}
                          >
                            {label}
                          </span>
                          <span
                            className={cn(
                              'text-sm leading-6',
                              selected ? 'font-medium text-ink' : 'text-ink-2',
                            )}
                          >
                            {opt}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </Container>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg-elev/95 backdrop-blur-md">
        <Container className="max-w-[1240px]">
          <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm text-ink-2">
              <span className="grid size-10 place-items-center rounded-xl border border-line bg-bg-soft text-primary">
                <ClipboardList className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-ink">
                  {isLastPage ? 'Review and submit' : 'Continue to the next part'}
                </p>
                <p className="text-ink-3">
                  {pageAnswered
                    ? isLastPage
                      ? allAnswered
                        ? 'All questions are complete. Submit to view your results.'
                        : 'Please answer every question before submitting.'
                      : 'This part is complete. Proceed when ready.'
                    : 'Select one answer for each question below.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:justify-end">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || submitting}
                className="min-w-[132px]"
              >
                <ArrowLeft className="size-4" />
                Previous
              </Button>

              <Button
                size="lg"
                onClick={handleNext}
                disabled={!pageAnswered || submitting || (isLastPage && !allAnswered)}
                className="min-w-[168px]"
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
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 text-center',
        accent ? 'border-primary/20 bg-primary-soft' : 'border-line bg-bg-soft',
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">{label}</p>
      <p className={cn('mt-1 text-2xl font-bold', accent ? 'text-primary' : 'text-ink')}>{value}</p>
    </div>
  );
}

export default PaginatedSkillAssessment;
