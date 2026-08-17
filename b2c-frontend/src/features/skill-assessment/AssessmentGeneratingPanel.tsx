'use client';

import Link from 'next/link';
import { AlertCircle, ArrowLeft, Clock, Loader2 } from 'lucide-react';
import { Container } from '@/src/components/marketing/Container';
import { buttonClasses } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { useTranslation, useGenerationPhases, useIsRtl } from '@/src/i18n';

export function AssessmentGeneratingPanel({ topicLabel }: { topicLabel: string }) {
  const { t } = useTranslation();
  const phases = useGenerationPhases();
  const isRtl = useIsRtl();

  return (
    <section className="flex min-h-full flex-1 flex-col bg-[var(--marketing-hero)] pt-6 pb-16 lg:pt-8 lg:pb-16">
      <Container>
        <Link
          href="/assessments"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
          {t('marketing.assessBackToAssessments')}
        </Link>

        <header className="mt-6 max-w-2xl">
          <h1 className="font-heading text-[2rem] font-medium leading-[1.18] tracking-[-0.02em] text-ink sm:text-[2.45rem]">
            {t('marketing.assessGeneratingTitle')}
          </h1>
          <p className="mt-3 text-base leading-7 text-ink/70">
            {t('marketing.assessGeneratingDesc', { topic: topicLabel })}
          </p>
        </header>

        <div className="mt-8 overflow-hidden rounded-md border border-line/80 bg-bg-elev/90">
          <div className="border-b border-line/70 px-5 py-5 sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-ink">{t('marketing.assessGenInProgress')}</p>
              <Loader2 className="size-5 shrink-0 animate-spin text-primary" strokeWidth={2} />
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-primary/20">
              <div className="h-full w-2/5 animate-pulse rounded-full bg-primary" />
            </div>
          </div>

          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
            <ul className="divide-y divide-line/70 border-b border-line/70 lg:border-b-0 lg:border-r">
              {phases.map((label, index) => (
                <li key={label} className="flex items-center gap-3 px-5 py-4 text-sm sm:px-8">
                  <span
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-md border',
                      index === 0
                        ? 'border-primary/30 bg-primary-soft text-primary'
                        : 'border-line/80 bg-bg-elev text-ink/40',
                    )}
                  >
                    {index === 0 ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <span className="size-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  <span className={index === 0 ? 'font-medium text-ink' : 'text-ink/55'}>{label}</span>
                </li>
              ))}
            </ul>

            <aside className="px-5 py-6 sm:px-8">
              <p className="text-sm font-medium text-ink">{t('marketing.assessWhatToExpect')}</p>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="text-xs text-ink/45">{t('marketing.summarySubject')}</dt>
                  <dd className="mt-1 font-medium text-ink">{topicLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink/45">{t('marketing.summaryFormat')}</dt>
                  <dd className="mt-1 text-ink/70">{t('marketing.assessFormatMcq')}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink/45">{t('marketing.assessDurationLabel')}</dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-ink/70">
                    <Clock className="size-3.5 text-primary" />
                    {t('marketing.assessDurationAbout')}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink/45">{t('marketing.summaryAfter')}</dt>
                  <dd className="mt-1 leading-6 text-ink/70">
                    {t('marketing.assessAfterCompletionShort')}
                  </dd>
                </div>
              </dl>
            </aside>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function AssessmentFailedPanel({
  topicLabel,
  reason,
}: {
  topicLabel: string;
  reason?: string | null;
}) {
  const { t } = useTranslation();

  return (
    <section className="flex min-h-full flex-1 flex-col bg-[var(--marketing-hero)] pt-6 pb-16 lg:pt-8 lg:pb-16">
      <Container>
        <div className="mx-auto mt-16 max-w-md text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-md bg-bad-soft text-bad">
            <AlertCircle className="size-6" strokeWidth={1.8} />
          </span>
          <h1 className="mt-5 text-lg font-medium text-ink">{t('marketing.assessFailedTitle')}</h1>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            {reason ?? t('marketing.assessFailedDefault')}
          </p>
          <p className="mt-2 text-sm text-ink/45">
            {t('marketing.assessSubjectLabel', { topic: topicLabel })}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/assessment/start"
              className={buttonClasses({
                size: 'lg',
                className: 'h-11 rounded-md px-5 text-sm font-medium shadow-none',
              })}
            >
              {t('marketing.assessTryAgain')}
            </Link>
            <Link
              href="/assessments"
              className={buttonClasses({
                variant: 'outline',
                size: 'lg',
                className: 'h-11 rounded-md bg-transparent px-5 text-sm font-medium',
              })}
            >
              {t('marketing.assessBackToAssessments')}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
