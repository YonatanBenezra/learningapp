'use client';

import Link from 'next/link';
import { AlertCircle, Clock, Loader2, Sparkles } from 'lucide-react';
import { Container } from '@/src/components/marketing/Container';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

const GENERATION_PHASES = [
  'Analyzing your subject area',
  'Drafting skill-level questions',
  'Balancing difficulty across topics',
  'Finalizing your 10-question assessment',
];

function ProgressBar() {
  return (
    <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-line/70">
      <div className="h-full w-2/5 animate-pulse rounded-full bg-primary" />
    </div>
  );
}

export function AssessmentGeneratingPanel({ topicLabel }: { topicLabel: string }) {
  return (
    <div className="flex min-h-[calc(100vh-88px)] items-center py-10 sm:py-14 lg:py-16">
      <Container className="max-w-[1240px]">
        <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-sm border border-line bg-bg-elev">
          <div className="relative border-b border-line bg-gradient-to-br from-primary/[0.12] via-bg-elev to-bg-soft px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-primary/10 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 left-1/4 size-40 rounded-full bg-primary/5 blur-3xl"
            />

            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                  <Sparkles className="size-3" />
                  Skill assessment
                </span>
                <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                  Preparing your assessment
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-2 sm:text-base">
                  Generating 10 tailored questions for{' '}
                  <span className="font-semibold text-ink">{topicLabel}</span>. This usually takes
                  a few seconds — feel free to leave; we&apos;ll load the assessment when it&apos;s
                  ready.
                </p>
                <ProgressBar />
              </div>

              <div className="grid size-[4.5rem] shrink-0 place-items-center rounded-sm border border-primary/20 bg-bg-elev sm:size-20">
                <Loader2 className="size-8 animate-spin text-primary sm:size-9" strokeWidth={2} />
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
            <ul className="divide-y divide-line border-b border-line lg:border-b-0 lg:border-r">
              {GENERATION_PHASES.map((label) => (
                <li
                  key={label}
                  className="flex items-center gap-3 px-6 py-4 text-sm sm:px-8 sm:py-4"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-sm bg-primary/10 text-primary">
                    <Loader2 className="size-4 animate-spin" />
                  </span>
                  <span className="text-ink-2">{label}</span>
                </li>
              ))}
            </ul>

            <aside className="bg-bg-soft/60 px-6 py-6 sm:px-8 sm:py-7">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
                What to expect
              </p>
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
    <div className="flex min-h-[calc(100vh-88px)] items-center py-10 sm:py-14 lg:py-16">
      <Container className="max-w-[1240px]">
        <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-sm border border-line bg-bg-elev px-6 py-10 text-center sm:px-10 sm:py-12 lg:px-12">
          <div
            className={cn(
              'mx-auto grid size-16 place-items-center rounded-sm border',
              'border-bad/30 bg-bad-soft text-bad',
            )}
          >
            <AlertCircle className="size-8" strokeWidth={1.8} />
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-ink sm:text-3xl">
            Could not generate assessment
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-ink-2 sm:text-base">
            {reason ?? 'Something went wrong while building your questions.'}
          </p>
          <p className="mt-2 text-sm text-ink-3">Subject: {topicLabel}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/assessments">
              <Button variant="outline">Back to assessments</Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
