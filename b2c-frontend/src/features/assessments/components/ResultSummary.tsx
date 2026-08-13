'use client';

import Link from 'next/link';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import type { AssessmentQuestion, AssessmentSubmission } from '@/src/domain/assessment';
import { cn } from '@/src/lib/utils';
import { useTranslation } from '@/src/i18n';

function scoreClass(score: number): string {
  if (score >= 70) return 'text-good';
  if (score >= 40) return 'text-warn';
  return 'text-bad';
}

export function ResultSummary({
  title,
  eyebrow = 'Assessment',
  questions,
  submission,
  answers,
  backHref,
  backLabel,
  onRetake,
  retaking,
}: {
  title: string;
  eyebrow?: string;
  questions: AssessmentQuestion[];
  submission: AssessmentSubmission;
  answers: Record<number, string>;
  backHref: string;
  backLabel: string;
  onRetake?: () => void;
  retaking?: boolean;
}) {
  const { t } = useTranslation();
  const results = [...submission.results].sort((a, b) => a.questionIndex - b.questionIndex);
  const correctCount = results.filter((r) => r.correct).length;

  return (
    <div className="w-full">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-ink-2 transition hover:text-primary"
      >
        <ArrowLeft className="size-4" /> {backLabel}
      </Link>

      <header className="mt-6 border-b border-line pb-6">
        <p className="text-xs font-medium uppercase tracking-widest text-ink-3">
          {t('assessmentRunner.result', { type: eyebrow })}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">{title}</h1>
        <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className={cn('text-4xl font-semibold tabular-nums', scoreClass(submission.score))}>
            {submission.score}%
          </p>
          <p className="text-sm text-ink-2">
            {t('assessmentRunner.correctOfTotal', {
              correct: String(correctCount),
              total: String(results.length),
            })}
          </p>
        </div>
      </header>

      <div className="mt-8 divide-y divide-line border-y border-line">
        {results.map((r) => {
          const q = questions[r.questionIndex];
          const given = (answers[r.questionIndex] ?? '').trim();
          return (
            <section key={r.questionIndex} className="py-6 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-4">
                <p className="text-xs font-medium uppercase tracking-widest text-ink-3">
                  {t('assessmentRunner.questionN', { n: String(r.questionIndex + 1) })}
                </p>
                <span
                  className={cn(
                    'text-xs font-medium uppercase tracking-wide',
                    r.correct ? 'text-good' : 'text-bad',
                  )}
                >
                  {r.correct ? t('assessmentRunner.correct') : t('assessmentRunner.incorrect')}
                </span>
              </div>
              <p className="mt-2 text-base font-medium leading-7 text-ink">
                {q?.question ?? t('assessmentRunner.question')}
              </p>
              <dl className="mt-4 space-y-2 border border-line bg-bg-soft px-4 py-3 text-sm">
                <div>
                  <dt className="inline font-medium text-ink">{t('assessmentRunner.yourAnswer')} </dt>
                  <dd className="inline text-ink-2">{given || '—'}</dd>
                </div>
                {!r.correct ? (
                  <div>
                    <dt className="inline font-medium text-ink">{t('assessmentRunner.correctAnswer')} </dt>
                    <dd className="inline text-ink-2">{r.correctAnswer}</dd>
                  </div>
                ) : null}
                {r.feedback ? (
                  <div>
                    <dt className="font-medium text-ink">{t('assessmentRunner.feedback')}</dt>
                    <dd className="mt-1 text-ink-3">{r.feedback}</dd>
                  </div>
                ) : null}
              </dl>
            </section>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-6">
        <Link href={backHref}>
          <Button variant="outline">{backLabel}</Button>
        </Link>
        <Link href="/quizzes">
          <Button variant="soft">{t('assessmentRunner.quizHistory')}</Button>
        </Link>
        {onRetake ? (
          <Button onClick={onRetake} disabled={retaking}>
            {retaking ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            {t('assessmentRunner.tryAnotherQuiz')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default ResultSummary;
