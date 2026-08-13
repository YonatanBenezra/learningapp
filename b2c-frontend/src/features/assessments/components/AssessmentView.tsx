'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useTranslation } from '@/src/i18n';
import { Button } from '@/src/components/ui/button';
import { ResultSummary } from './ResultSummary';
import type {
  AssessmentQuestion,
  AssessmentSubmission,
  SubmittedAnswer,
} from '@/src/domain/assessment';

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function AssessmentView({
  title,
  subtitle,
  eyebrow = 'Assessment',
  submitLabel = 'Submit assessment',
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
  subtitle?: string;
  eyebrow?: string;
  submitLabel?: string;
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
  const { t } = useTranslation();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const setAnswer = (i: number, val: string) => setAnswers((prev) => ({ ...prev, [i]: val }));

  if (submission) {
    return (
      <ResultSummary
        title={title}
        eyebrow={eyebrow}
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

  const answeredCount = questions.filter((_, i) => (answers[i] ?? '').trim() !== '').length;
  const allAnswered = answeredCount === questions.length;

  const submit = () =>
    onSubmit(questions.map((_, i) => ({ questionIndex: i, answer: answers[i] ?? '' })));

  return (
    <div className="w-full">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-ink-2 transition hover:text-primary"
      >
        <ArrowLeft className="size-4" /> {backLabel}
      </Link>

      <header className="mt-6 border-b border-line pb-6">
        <p className="text-xs font-medium uppercase tracking-widest text-ink-3">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-3xl text-sm text-ink-2">{subtitle}</p> : null}
        <p className="mt-4 text-sm text-ink-3">
          {t('assessmentRunner.questionsAnswered', {
            total: String(questions.length),
            answered: String(answeredCount),
          })}
        </p>
      </header>

      <div className="mt-8 divide-y divide-line border-y border-line">
        {questions.map((q, i) => (
          <section key={i} className="py-8 first:pt-0 last:pb-0">
            <p className="text-xs font-medium uppercase tracking-widest text-ink-3">
              {t('assessmentRunner.questionN', { n: String(i + 1) })}
            </p>
            <h2 className="mt-2 text-base font-medium leading-7 text-ink">{q.question}</h2>

            {q.type === 'mcq' && q.options ? (
              <div className="mt-5 flex flex-col gap-2">
                {q.options.map((opt, optIndex) => {
                  const selected = answers[i] === opt;
                  const label = OPTION_LABELS[optIndex] ?? String(optIndex + 1);
                  return (
                    <label
                      key={opt}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 border px-4 py-3 transition-colors',
                        selected
                          ? 'border-primary bg-primary-soft/40'
                          : 'border-line bg-bg-elev hover:border-ink-3/30',
                      )}
                    >
                      <input
                        type="radio"
                        name={`q-${i}`}
                        className="sr-only"
                        checked={selected}
                        onChange={() => setAnswer(i, opt)}
                      />
                      <span className="w-5 shrink-0 text-sm font-semibold text-primary">{label}.</span>
                      <span className={cn('text-sm leading-6', selected ? 'text-ink' : 'text-ink-2')}>
                        {opt}
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <textarea
                value={answers[i] ?? ''}
                onChange={(e) => setAnswer(i, e.target.value)}
                placeholder={t('assessmentRunner.writeAnswerPlaceholder')}
                className="mt-5 min-h-28 w-full border border-line bg-bg-elev px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-3 focus:border-primary"
              />
            )}
          </section>
        ))}
      </div>

      {submitError ? (
        <p className="mt-6 border border-bad/30 bg-bad-soft px-4 py-3 text-sm text-bad">
          {submitError}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-3">
          {allAnswered
            ? t('assessmentRunner.allAnswered')
            : t('assessmentRunner.answerAllBeforeSubmit', { count: String(questions.length) })}
        </p>
        <Button onClick={submit} disabled={submitting || !allAnswered} className="sm:min-w-40">
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

export default AssessmentView;
