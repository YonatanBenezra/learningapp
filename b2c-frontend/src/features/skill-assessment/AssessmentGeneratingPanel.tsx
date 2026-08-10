'use client';

import Link from 'next/link';
import { AlertCircle, ArrowLeft, Clock, Loader2, Sparkles } from 'lucide-react';
import { Container } from '@/src/components/marketing/Container';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

const GENERATION_PHASES = [
  'Analyzing your subject area',
  'Drafting skill-level questions',
  'Balancing difficulty across topics',
  'Finalizing your 10-question assessment',
];

export function AssessmentGeneratingPanel({ topicLabel }: { topicLabel: string }) {
  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-bg pb-20 pt-6 lg:pt-8">
      <Container>
        <div className="mx-auto max-w-6xl">
          <Link
            href="/assessments"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-2 transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            Back to assessments
          </Link>

          <header className="mt-5 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="size-3.5" />
              Generating
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Preparing your assessment
            </h1>
            <p className="mt-2 text-sm leading-6 text-ink-2 sm:text-base">
              We are generating 10 questions for{' '}
              <span className="font-medium text-ink">{topicLabel}</span>. This usually completes
              within a few seconds.
            </p>
          </header>

          <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card">
            <div className="border-b border-line bg-bg-soft/50 px-6 py-5 sm:px-8">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-ink">Generation in progress</p>
                <Loader2 className="size-5 shrink-0 animate-spin text-primary" strokeWidth={2} />
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-line">
                <div className="h-full w-2/5 animate-pulse rounded-full bg-gradient-to-r from-primary to-primary-2" />
              </div>
            </div>

            <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
              <ul className="divide-y divide-line border-b border-line lg:border-b-0 lg:border-r">
                {GENERATION_PHASES.map((label, index) => (
                  <li key={label} className="flex items-center gap-3 px-6 py-4 text-sm sm:px-8">
                    <span
                      className={cn(
                        'grid size-8 shrink-0 place-items-center rounded-lg border text-primary',
                        index === 0
                          ? 'border-primary/30 bg-primary/[0.06]'
                          : 'border-line bg-bg-soft text-ink-3',
                      )}
                    >
                      {index === 0 ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <span className="size-1.5 rounded-full bg-current" />
                      )}
                    </span>
                    <span className={index === 0 ? 'font-medium text-ink' : 'text-ink-2'}>
                      {label}
                    </span>
                  </li>
                ))}
              </ul>

              <aside className="px-6 py-6 sm:px-8 sm:py-8">
                <p className="text-sm font-semibold text-ink">What to expect</p>
                <dl className="mt-4 space-y-4 text-sm">
                  <div>
                    <dt className="text-ink-3">Subject</dt>
                    <dd className="mt-1 font-medium text-ink">{topicLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-3">Format</dt>
                    <dd className="mt-1 text-ink-2">10 multiple-choice questions</dd>
                  </div>
                  <div>
                    <dt className="text-ink-3">Duration</dt>
                    <dd className="mt-1 flex items-center gap-1.5 text-ink-2">
                      <Clock className="size-3.5 text-primary" />
                      About 5 minutes
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-3">After completion</dt>
                    <dd className="mt-1 leading-6 text-ink-2">
                      Your skill level and a personalized course recommendation.
                    </dd>
                  </div>
                </dl>
              </aside>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

export function AssessmentFailedPanel({
  topicLabel,
  reason,
}: {
  topicLabel: string;
  reason?: string | null;
}) {
  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-bg pb-20 pt-6 lg:pt-8">
      <Container>
        <div className="mx-auto max-w-2xl">
          <div className="overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card">
            <div className="border-b border-bad/20 bg-bad-soft/40 px-6 py-10 text-center sm:px-10">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-bad/30 bg-bad-soft text-bad">
                <AlertCircle className="size-7" strokeWidth={1.8} />
              </div>
              <h1 className="mt-5 text-2xl font-bold text-ink sm:text-3xl">
                Could not generate assessment
              </h1>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-ink-2 sm:text-base">
                {reason ?? 'Something went wrong while building your questions.'}
              </p>
              <p className="mt-2 text-sm text-ink-3">Subject: {topicLabel}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 px-6 py-6 sm:px-10">
              <Link href="/assessment/start">
                <Button className="rounded-xl">Try again</Button>
              </Link>
              <Link href="/assessments">
                <Button variant="outline" className="rounded-xl">
                  Back to assessments
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
