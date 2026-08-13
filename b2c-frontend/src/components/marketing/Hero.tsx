'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Network,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { buttonClasses } from '@/src/components/ui/button';
import { useTranslation, useIsRtl } from '@/src/i18n';
import { Container } from './Container';
import { HeroTerminalDemo } from './HeroTerminalDemo';

const DOMAINS = [
  { labelKey: 'marketing.domainProgramming' as const, icon: Code2 },
  { labelKey: 'marketing.domainCyberSecurity' as const, icon: ShieldCheck },
  { labelKey: 'marketing.domainNetworking' as const, icon: Network },
  { labelKey: 'marketing.domainAiData' as const, icon: Sparkles },
] as const;

const PREVIEW_TAGS = [
  'marketing.tagQuizzes',
  'marketing.tagExams',
  'marketing.tagAchievements',
  'marketing.tagProgress',
] as const;

function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -left-40 top-0 size-[520px] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -right-32 bottom-0 size-[480px] rounded-full bg-tint-blue/40 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(13,110,99,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(13,110,99,0.06) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  );
}

function HeroPlatformPreview() {
  const { t } = useTranslation();

  return (
    <div className="relative mx-auto w-full max-w-[540px] lg:mx-0 lg:ml-auto">
      <div className="rounded-lg border border-line bg-[var(--marketing-card)] p-5 shadow-soft sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
              <Sparkles className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{t('marketing.workspaceTitle')}</p>
              <p className="text-xs text-ink-3">{t('marketing.workspaceSubtitle')}</p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-bg-soft px-3 py-1 text-xs font-medium text-ink-2">
            <span className="size-1.5 rounded-full bg-good" />
            {t('marketing.activeSession')}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-bg p-4 dark:bg-bg-soft">
            <div className="flex items-center gap-2 text-primary">
              <ClipboardCheck className="size-4" />
              <p className="text-xs font-semibold uppercase tracking-wide">
                {t('marketing.skillAssessmentLabel')}
              </p>
            </div>
            <p className="mt-3 text-2xl font-semibold text-ink">{t('marketing.levelIntermediate')}</p>
            <p className="mt-1 text-sm text-ink-2">{t('marketing.matchedLevel')}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-line">
              <div className="h-full w-[82%] rounded-full bg-primary" />
            </div>
            <p className="mt-2 text-xs text-ink-3">{t('marketing.readinessScore')}</p>
          </div>

          <div className="rounded-lg border border-line bg-bg p-4 dark:bg-bg-soft">
            <div className="flex items-center gap-2 text-primary">
              <BookOpen className="size-4" />
              <p className="text-xs font-semibold uppercase tracking-wide">{t('marketing.aiCourseLabel')}</p>
            </div>
            <p className="mt-3 text-sm font-semibold leading-snug text-ink">
              {t('marketing.sampleCourseTitle')}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <dt className="text-xs text-ink-3">{t('marketing.modules')}</dt>
                <dd className="text-lg font-semibold text-ink">4</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-3">{t('marketing.lessons')}</dt>
                <dd className="text-lg font-semibold text-ink">23</dd>
              </div>
            </dl>
          </div>
        </div>

        <HeroTerminalDemo />

        <div className="mt-4 flex flex-wrap gap-2">
          {PREVIEW_TAGS.map((key) => (
            <span
              key={key}
              className="rounded-full border border-line bg-bg-soft px-3 py-1 text-xs font-medium text-ink-2"
            >
              {t(key)}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-line bg-bg-soft px-4 py-3">
          <div>
            <p className="text-xs font-medium text-ink-3">{t('marketing.learningFormat')}</p>
            <p className="mt-0.5 text-sm font-semibold text-ink">{t('marketing.learningFormatValue')}</p>
          </div>
          <span className="hidden rounded-lg bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary sm:inline">
            {t('marketing.allInOnePlatform')}
          </span>
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
    <section id="top" className="relative overflow-hidden bg-[var(--marketing-hero)]">
      <HeroBackdrop />

      <Container className="relative grid items-center gap-12 py-14 lg:grid-cols-2 lg:gap-16 lg:py-20">
        <div className="max-w-xl" data-tour="tour-hero">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-bg-elev px-4 py-1.5 text-sm font-medium text-ink-2">
            <Sparkles className="size-4 text-primary" />
            {t('marketing.heroBadge')}
          </p>

          <h1 className="mt-6 font-heading text-[2.25rem] font-semibold leading-[1.12] tracking-tight text-ink sm:text-[2.75rem] lg:text-[3.25rem]">
            {t('marketing.heroTitle')}{' '}
            <span className="text-primary">{t('marketing.heroTitleHighlight')}</span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-2 sm:text-lg">
            {t('marketing.heroDescription')}
          </p>

          <div
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            data-tour="tour-hero-actions"
          >
            <Link href="/signup" className={buttonClasses({ size: 'lg', className: 'rounded-lg' })}>
              {t('common.startFree')}
              <ArrowRight className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
            </Link>
            <Link
              href="/assessments"
              className={buttonClasses({
                variant: 'outline',
                size: 'lg',
                className: 'rounded-lg bg-bg-elev',
              })}
            >
              {t('marketing.takeSkillAssessment')}
            </Link>
          </div>

          <ul className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
            {trustPoints.map((point) => (
              <li key={point} className="flex items-center gap-2 text-sm text-ink-2">
                <CheckCircle2 className="size-4 shrink-0 text-good" />
                {point}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-2">
            {DOMAINS.map(({ labelKey, icon: Icon }) => (
              <span
                key={labelKey}
                className="inline-flex items-center gap-2 rounded-lg border border-line bg-bg-elev px-3 py-2 text-sm font-medium text-ink-2"
              >
                <Icon className="size-4 text-primary" />
                {t(labelKey)}
              </span>
            ))}
          </div>
        </div>

        <HeroPlatformPreview />
      </Container>
    </section>
  );
}
