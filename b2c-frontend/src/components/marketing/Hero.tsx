'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { buttonClasses } from '@/src/components/ui/button';
import { useTranslation, useIsRtl } from '@/src/i18n';
import { Container } from './Container';
import { HeroTerminalDemo } from './HeroTerminalDemo';

function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -left-32 top-10 size-[520px] rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -right-20 bottom-0 size-[460px] rounded-full bg-primary/6 blur-3xl" />
    </div>
  );
}

function PathStep({
  index,
  title,
  last = false,
  children,
}: {
  index: string;
  title: string;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex w-9 shrink-0 flex-col items-center">
        <span className="grid size-9 place-items-center rounded-full bg-primary-soft text-[11px] font-semibold tracking-wide text-primary">
          {index}
        </span>
        {last ? null : <span className="mt-2 w-px flex-1 bg-line" />}
      </div>
      <div className={last ? 'min-w-0 flex-1' : 'min-w-0 flex-1 pb-8'}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">{title}</p>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

function HeroPlatformPreview() {
  const { t } = useTranslation();

  return (
    <div className="relative mx-auto w-full max-w-[540px] lg:mx-0 lg:max-w-none">
      <div className="flex min-h-[560px] flex-col overflow-hidden rounded-3xl border border-line bg-bg-elev lg:min-h-[640px]">
        <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-line-2" />
            <span className="size-2.5 rounded-full bg-line-2" />
            <span className="size-2.5 rounded-full bg-line-2" />
          </span>
          <p className="truncate text-sm font-medium text-ink">{t('marketing.workspaceTitle')}</p>
          <span className="ms-auto inline-flex items-center gap-1.5 text-xs text-ink-3">
            <span className="size-1.5 rounded-full bg-good" />
            {t('marketing.activeSession')}
          </span>
        </div>

        <div className="flex flex-1 flex-col px-5 py-6 sm:px-7 sm:py-8">
          <PathStep index="01" title={t('marketing.heroStepAssess')}>
            <p className="text-3xl font-semibold tracking-tight text-ink">
              {t('marketing.levelIntermediate')}
            </p>
            <p className="mt-1 text-sm text-ink-2">{t('marketing.matchedLevel')}</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-line">
              <div className="h-full w-[82%] rounded-full bg-primary" />
            </div>
            <p className="mt-2 text-xs text-ink-3">{t('marketing.readinessScore')}</p>
          </PathStep>

          <PathStep index="02" title={t('marketing.heroStepCourse')}>
            <p className="text-lg font-semibold leading-snug text-ink">
              {t('marketing.sampleCourseTitle')}
            </p>
            <p className="mt-2 text-sm text-ink-2">
              4 {t('marketing.modules')}
              <span className="mx-2 text-ink-3/40">·</span>
              23 {t('marketing.lessons')}
            </p>
          </PathStep>

          <PathStep index="03" title={t('marketing.heroStepLab')} last>
            <HeroTerminalDemo />
          </PathStep>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const { t } = useTranslation();
  const isRtl = useIsRtl();

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
      <HeroBackdrop />

      <Container className="relative grid w-full items-center gap-14 py-28 lg:grid-cols-2 lg:gap-16 lg:py-32">
        <div className="max-w-xl" data-tour="tour-hero">
          <p className="inline-flex rounded-full border border-line bg-bg-elev px-3.5 py-1.5 text-sm font-medium text-ink-2">
            {t('marketing.heroBadge')}
          </p>

          <h1 className="mt-8 font-heading text-[2.35rem] font-semibold leading-[1.12] tracking-tight text-ink sm:text-[2.9rem] lg:text-[3.4rem]">
            {t('marketing.heroTitle')}{' '}
            <span className="text-primary">{t('marketing.heroTitleHighlight')}</span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-2 sm:text-lg">
            {t('marketing.heroDescription')}
          </p>

          <div
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
            data-tour="tour-hero-actions"
          >
            <Link
              href="/assessments"
              className={buttonClasses({ size: 'lg', className: 'rounded-full px-6' })}
            >
              {t('marketing.takeSkillAssessment')}
              <ArrowRight className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
            </Link>
            <Link
              href="/signup"
              className={buttonClasses({
                variant: 'ghost',
                size: 'lg',
                className: 'rounded-full px-5',
              })}
            >
              {t('common.startFree')}
            </Link>
          </div>

          <p className="mt-10 text-sm text-ink-3">
            {trustPoints.map((point, index) => (
              <span key={point}>
                {index > 0 ? <span className="mx-2 text-ink-3/40">·</span> : null}
                {point}
              </span>
            ))}
          </p>
        </div>

        <HeroPlatformPreview />
      </Container>
    </section>
  );
}
