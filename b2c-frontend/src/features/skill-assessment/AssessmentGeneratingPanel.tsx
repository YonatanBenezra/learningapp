'use client';

import Link from 'next/link';
import { AlertCircle, Clock, Loader2 } from 'lucide-react';
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
    <div className="bg-bg pb-20 pt-10 lg:pt-12">
      <Container>
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Preparing your assessment
            </h1>
            <p className="mt-3 text-base leading-7 text-ink-2">
              We are generating 10 questions for{' '}
              <span className="font-medium text-ink">{topicLabel}</span>. This typically completes
              within a few seconds. You may leave this page — the assessment will load when ready.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card">
            <div className="border-b border-line px-6 py-6 sm:px-10">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-ink-2">Generation in progress</p>
                <Loader2 className="size-5 shrink-0 animate-spin text-primary" strokeWidth={2} />
              </div>
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-line">
                <div className="h-full w-2/5 animate-pulse rounded-full bg-primary transition-all" />
              </div>
            </div>

            <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
              <ul className="divide-y divide-line border-b border-line lg:border-b-0 lg:border-r">
                {GENERATION_PHASES.map((label, index) => (
                  <li
                    key={label}
                    className="flex items-center gap-3 px-6 py-4 text-sm sm:px-10"
                  >
                    <span
                      className={cn(
                        'grid size-7 shrink-0 place-items-center rounded-full border text-primary',
                        index === 0
                          ? 'border-primary/30 bg-primary/[0.06]'
                          : 'border-line bg-bg-soft text-ink-3',
                      )}
                    >
                      {index === 0 ? (
                        <Loader2 className="size-3.5 animate-spin" />
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

              <aside className="px-6 py-6 sm:px-10 sm:py-8">
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
    <div className="bg-bg pb-20 pt-10 lg:pt-12">
      <Container>
        <div className="mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-2xl border border-line bg-bg-elev px-6 py-12 text-center shadow-card sm:px-10 sm:py-14">
            <div className="mx-auto grid size-14 place-items-center rounded-full border border-bad/30 bg-bad-soft text-bad">
              <AlertCircle className="size-7" strokeWidth={1.8} />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-ink sm:text-3xl">
              Could not generate assessment
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-ink-2 sm:text-base">
              {reason ?? 'Something went wrong while building your questions.'}
            </p>
            <p className="mt-2 text-sm text-ink-3">Subject: {topicLabel}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/assessment/start">
                <Button className="rounded-full">Try again</Button>
              </Link>
              <Link href="/assessments">
                <Button variant="outline" className="rounded-full">
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
