'use client';

import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { TRIAL_PERIOD_MONTHS } from '@/src/constants/pricing';
import { useAuthHydrated } from '@/src/features/auth/useAuthHydrated';
import { defaultDashboardPath } from '@/src/features/auth/dashboardRoutes';
import { useAuthStore } from '@/src/store/authStore';
import { Container } from './Container';
import { cn } from '@/src/lib/utils';
import { useTranslation, usePricingPlans, useIsRtl } from '@/src/i18n';

type PlanId = 'free' | 'standard' | 'premium';

type PlanConfig = ReturnType<typeof usePricingPlans>[number];

function PlanCard({
  plan,
  href,
  cta,
  recommendedLabel,
  isRtl,
}: {
  plan: PlanConfig;
  href: string;
  cta: string;
  recommendedLabel: string;
  isRtl: boolean;
}) {
  const isFeatured = plan.featured;

  return (
    <article
      className={cn(
        'relative flex flex-col rounded-2xl border bg-bg-elev p-6 shadow-card sm:p-8',
        isFeatured ? 'border-primary/30 ring-1 ring-primary/10' : 'border-line',
      )}
    >
      {isFeatured ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
          {recommendedLabel}
        </span>
      ) : null}

      <div>
        <h3 className="text-xl font-bold text-ink">{plan.name}</h3>
        <p className="mt-1 text-sm text-ink-2">{plan.subtitle}</p>
      </div>

      <div className="mt-5 flex items-end gap-1">
        <span className="text-4xl font-bold leading-none tracking-tight text-ink sm:text-[42px]">
          ${plan.price}
        </span>
        <span className="pb-1 text-sm font-medium text-ink-3">/{plan.period}</span>
      </div>

      <div className="my-6 h-px bg-line" />

      <ul className="flex flex-1 flex-col gap-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm leading-6">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={2.5} />
            <span className="text-ink-2">{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={href}
        className={cn(
          'mt-8 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors',
          isFeatured
            ? 'bg-primary text-white hover:bg-primary-dark'
            : 'border border-line bg-bg-soft text-ink hover:border-line-2 hover:bg-bg',
        )}
      >
        {cta}
        <ArrowRight className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
      </Link>
    </article>
  );
}

function PricingPlans({ fullPage = false }: { fullPage?: boolean }) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const plans = usePricingPlans();
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const userRole = useAuthStore((s) => s.user?.role);

  function planHref(id: PlanId) {
    if (id === 'premium') return hydrated && isAuthenticated ? '/upgrade' : '/signup';
    return hydrated && isAuthenticated ? defaultDashboardPath(userRole) : '/signup';
  }

  function planCta(id: PlanId) {
    if (id === 'free') {
      return hydrated && isAuthenticated ? t('marketing.ctaGoDashboard') : t('marketing.ctaGetStartedFree');
    }
    if (id === 'standard') {
      return hydrated && isAuthenticated ? t('marketing.ctaCurrentPlan') : t('marketing.ctaChooseStandard');
    }
    return hydrated && isAuthenticated ? t('marketing.ctaUpgradePremium') : t('marketing.ctaChoosePremium');
  }

  return (
    <section
      id="pricing"
      className={cn('bg-bg', fullPage ? 'pt-10 pb-10 sm:pb-14 lg:pt-12' : 'py-10 sm:py-14')}
    >
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          {fullPage ? (
            <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {t('marketing.membershipPlans')}
            </h1>
          ) : (
            <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {t('marketing.membershipPlans')}
            </h2>
          )}
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-ink-2 sm:text-base">
            {t('marketing.pricingIntro', { months: String(TRIAL_PERIOD_MONTHS) })}
          </p>
        </div>

        <div className="mx-auto mt-8 grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              href={planHref(plan.id)}
              cta={planCta(plan.id)}
              recommendedLabel={t('marketing.recommended')}
              isRtl={isRtl}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

export function Pricing({ fullPage = false }: { fullPage?: boolean }) {
  return <PricingPlans fullPage={fullPage} />;
}
