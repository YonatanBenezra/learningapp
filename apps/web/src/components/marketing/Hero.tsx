'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { buttonClasses } from '@/src/components/ui/button';
import { useTranslation, useIsRtl } from '@/src/i18n';
import { ASSESSMENT_START_PATH, assessmentStartRedirect } from '@/src/features/skill-assessment/assessmentGate';
import { useAssessmentGate } from '@/src/features/skill-assessment/useAssessmentGate';
import { Container } from './Container';
import { HeroVisual } from './HeroVisual';

export function Hero() {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const { completed, loading } = useAssessmentGate();
  const practiceHref = !loading && completed ? '/problems' : assessmentStartRedirect('/problems');

  const trustPoints = [
    t('marketing.trustFreeTier'),
    t('marketing.trustNoCard'),
    t('marketing.trustLabs'),
  ] as const;

  return (
    <section
      id="top"
      className="relative -mt-16 flex min-h-[100svh] items-center overflow-hidden bg-[var(--marketing-hero)]"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 aspect-square w-[min(165vw,1500px)] -translate-x-1/2 -translate-y-1/2">
          <HeroVisual />
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0 bg-[var(--marketing-hero)]/40 backdrop-blur-[8px] dark:bg-[var(--marketing-hero)]/35"
        aria-hidden="true"
      />

      <Container className="relative z-10 flex w-full justify-center py-28 lg:py-32">
        <div className="relative mx-auto max-w-[46rem] text-center">
          <div
            className="pointer-events-none absolute -inset-x-8 -inset-y-10 bg-[var(--marketing-hero)]/86 blur-2xl sm:-inset-x-16 sm:-inset-y-14 dark:bg-[var(--marketing-hero)]/80"
            aria-hidden="true"
          />

          <div className="relative">
            <p className="inline-flex items-center rounded-full border border-line/50 bg-bg/50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-2 backdrop-blur-sm">
              {t('marketing.heroBadge')}
            </p>

            <h1 className="mt-7 font-heading text-[2.45rem] font-semibold leading-[1.12] tracking-[-0.025em] text-ink sm:text-[3.05rem] lg:text-[3.5rem]">
              {t('marketing.heroTitle')}{' '}
              <span className="bg-gradient-to-r from-primary to-[#7c3aed] bg-clip-text text-transparent">
                {t('marketing.heroTitleHighlight')}
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base font-normal leading-7 text-ink/75 sm:text-lg sm:leading-8">
              {t('marketing.heroDescription')}
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-3">
              <Link
                href={practiceHref}
                className={buttonClasses({
                  size: 'lg',
                  className: 'h-11 rounded-md px-5 text-sm font-medium shadow-none',
                })}
              >
                {t('marketing.startPracticing')}
                <ArrowRight className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
              </Link>
              <Link
                href={!loading && completed ? '/signup?redirect=%2Fproblems' : `${ASSESSMENT_START_PATH}?redirect=%2Fproblems`}
                className={buttonClasses({
                  variant: 'outline',
                  size: 'lg',
                  className: 'h-11 rounded-md bg-transparent px-5 text-sm font-medium',
                })}
              >
                {t('marketing.heroSignUp')}
              </Link>
            </div>

            <p className="mt-8 text-[12px] font-normal tracking-wide text-ink/55">
              {trustPoints.map((point, index) => (
                <span key={point}>
                  {index > 0 ? <span className="mx-2.5 text-ink/25">·</span> : null}
                  {point}
                </span>
              ))}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
