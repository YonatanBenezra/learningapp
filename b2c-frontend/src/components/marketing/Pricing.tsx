'use client';

import Link from 'next/link';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import {
  FREE_PLAN_FEATURES,
  PREMIUM_PLAN_FEATURES,
  PREMIUM_PRICE_USD,
  STANDARD_PLAN_FEATURES,
  STANDARD_PRICE_USD,
} from '@/src/constants/pricing';
import { useAuthHydrated } from '@/src/features/auth/useAuthHydrated';
import { defaultDashboardPath } from '@/src/features/auth/dashboardRoutes';
import { useAuthStore } from '@/src/store/authStore';
import { Container } from './Container';
import { cn } from '@/src/lib/utils';

type PlanId = 'free' | 'standard' | 'premium';

type PlanConfig = {
  id: PlanId;
  name: string;
  subtitle: string;
  price: number;
  period: string;
  features: readonly string[];
  featured?: boolean;
};

const PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Free',
    subtitle: 'Perfect for getting started',
    price: 0,
    period: 'forever',
    features: FREE_PLAN_FEATURES,
  },
  {
    id: 'standard',
    name: 'Standard',
    subtitle: 'Perfect for individuals',
    price: STANDARD_PRICE_USD,
    period: 'month',
    features: STANDARD_PLAN_FEATURES,
    featured: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    subtitle: 'Perfect for power learners',
    price: PREMIUM_PRICE_USD,
    period: 'month',
    features: PREMIUM_PLAN_FEATURES,
  },
];

function PlanCard({
  plan,
  href,
  cta,
}: {
  plan: PlanConfig;
  href: string;
  cta: string;
}) {
  const isFeatured = plan.featured;

  return (
    <article
      className={cn(
        'relative flex flex-col rounded-[10px] px-7 py-9 sm:px-8 sm:py-10 border border-line/50',
        isFeatured
          ? 'bg-[#1E293B] text-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] lg:-mt-4 lg:mb-4 lg:scale-[1.03] dark:bg-[#243044] dark:shadow-[var(--shadow-elevated)]'
          : 'bg-bg-soft text-ink',
      )}
    >
      {isFeatured ? (
        <span className="absolute -right-1 top-6 rotate-45 bg-secondary px-8 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
          Most Popular
        </span>
      ) : null}

      <div>
        <h3 className="text-[22px] font-bold">{plan.name}</h3>
        <p className={cn('mt-1 text-sm', isFeatured ? 'text-white/70' : 'text-ink-3')}>
          {plan.subtitle}
        </p>
      </div>

      <div className="mt-6 flex items-end gap-1">
        <span className="text-[42px] font-bold leading-none tracking-tight">${plan.price}</span>
        <span className={cn('pb-1 text-sm font-medium', isFeatured ? 'text-white/60' : 'text-ink-3')}>
          /{plan.period}
        </span>
      </div>

      <div className={cn('my-6 h-px', isFeatured ? 'bg-white/15' : 'bg-line')} />

      <ul className="flex flex-1 flex-col gap-3.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm leading-6">
            <Check
              className={cn('mt-0.5 size-4 shrink-0', isFeatured ? 'text-primary-2' : 'text-primary')}
              strokeWidth={2.5}
            />
            <span className={isFeatured ? 'text-white/85' : 'text-ink-2'}>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={href}
        className={cn(
          'mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[4px] text-sm font-semibold transition-colors',
          isFeatured
            ? 'bg-primary text-white hover:bg-primary-dark'
            : 'bg-primary text-white hover:bg-primary-dark',
        )}
      >
        {cta}
        <ArrowRight className="size-4" />
      </Link>
    </article>
  );
}

function PricingPlans({ fullPage = false }: { fullPage?: boolean }) {
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const userRole = useAuthStore((s) => s.user?.role);

  function planHref(id: PlanId) {
    if (id === 'premium') return hydrated && isAuthenticated ? '/upgrade' : '/signup';
    return hydrated && isAuthenticated ? defaultDashboardPath(userRole) : '/signup';
  }

  function planCta(id: PlanId) {
    if (id === 'free') return hydrated && isAuthenticated ? 'Go to dashboard' : 'Select plan';
    if (id === 'standard') return hydrated && isAuthenticated ? 'Current plan' : 'Select plan';
    return hydrated && isAuthenticated ? 'Upgrade now' : 'Select plan';
  }

  return (
    <section
      id="pricing"
      className={cn(
        'relative overflow-hidden pb-12 sm:pb-24',
        fullPage ? 'pt-20 sm:pt-32' : 'pt-6',
      )}
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(circle at 10% 20%, rgba(0,127,142,0.06) 0%, transparent 40%), radial-gradient(circle at 90% 10%, rgba(251,191,36,0.08) 0%, transparent 35%)',
        }}
      />

      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            <Sparkles className="size-3.5" />
            Pricing table
          </span>
          {fullPage ? (
            <h1 className="mt-5 text-[clamp(1.75rem,4vw,2.75rem)] font-bold tracking-tight text-ink">
              Great{' '}
              <span className="relative inline-block">
                Membership
                <span className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-primary/80" />
              </span>{' '}
              Plan
            </h1>
          ) : (
            <h2 className="mt-5 text-[clamp(1.75rem,4vw,2.75rem)] font-bold tracking-tight text-ink">
              Great{' '}
              <span className="relative inline-block">
                Membership
                <span className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-primary/80" />
              </span>{' '}
              Plan
            </h2>
          )}
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-ink-2 sm:text-base">
            Choose the plan that fits your learning goals. Start free, grow with Standard, or unlock
            everything with Premium.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3 lg:items-center lg:gap-5">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              href={planHref(plan.id)}
              cta={planCta(plan.id)}
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
