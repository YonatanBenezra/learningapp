'use client';

import { useState } from 'react';
import { Check, ChevronDown, Clock, Crown, Minus, Sparkles } from 'lucide-react';
import {
  FREE_PLAN_FEATURES,
  PLAN_COMPARISON,
  PREMIUM_PLAN_FEATURES,
  PREMIUM_PRICE_USD,
  PRICING_FAQ,
  STANDARD_PLAN_FEATURES,
  STANDARD_PRICE_USD,
  TRIAL_PERIOD_MONTHS,
} from '@/src/constants/pricing';
import { useSubscription, useCheckout, useBillingPortal } from '@/src/features/subscription';
import { ApiError } from '@/src/infrastructure/apiClient';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Skeleton } from '@/src/components/ui/skeleton';
import { cn } from '@/src/lib/utils';

type PaidPlan = 'standard' | 'premium';

function FeatureList({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((feature) => (
        <li key={feature} className="flex items-start gap-3 text-sm leading-6">
          <Check className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={2.5} />
          <span className="text-ink-2">{feature}</span>
        </li>
      ))}
    </ul>
  );
}

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function mutationMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

function statusVariant(status: string): 'good' | 'warn' | 'bad' | 'outline' {
  if (status === 'active') return 'good';
  if (status === 'past_due') return 'warn';
  if (status === 'canceled') return 'bad';
  return 'outline';
}

function ComparisonCell({ value }: { value: string }) {
  if (value === '—') {
    return <Minus className="mx-auto size-4 text-ink-3" aria-hidden="true" />;
  }
  if (value === 'Yes') {
    return <Check className="mx-auto size-4 text-good" strokeWidth={2.5} aria-hidden="true" />;
  }
  return <span>{value}</span>;
}

function PlanComparisonTable() {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card">
      <div className="border-b border-line px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-ink">Compare plans</h2>
        <p className="mt-1 text-sm text-ink-2">
          Free, Standard, and Premium — aligned with your account limits.
        </p>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr] border-b border-line bg-bg-soft px-5 py-3.5 text-sm font-medium text-ink sm:px-6">
            <span>Feature</span>
            <span className="text-center">Free</span>
            <span className="text-center">Standard</span>
            <span className="text-center text-primary">Premium</span>
          </div>
          {PLAN_COMPARISON.map((row, index) => (
            <div
              key={row.feature}
              className={cn(
                'grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr] border-b border-line px-5 py-3 text-sm last:border-b-0 sm:px-6',
                index % 2 === 1 && 'bg-bg-soft/50',
              )}
            >
              <span className="font-medium text-ink">{row.feature}</span>
              <span className="text-center text-ink-2">
                <ComparisonCell value={row.free} />
              </span>
              <span className="text-center text-ink-2">
                <ComparisonCell value={row.standard} />
              </span>
              <span className="text-center font-medium text-primary">
                <ComparisonCell value={row.premium} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UpgradeFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">Billing FAQ</h2>
        <p className="mt-1 text-sm text-ink-2">Common questions about trials, billing, and limits.</p>
      </div>
      <div className="flex flex-col gap-3">
        {PRICING_FAQ.map((item, index) => {
          const isOpen = open === index;
          return (
            <div
              key={item.q}
              className="overflow-hidden rounded-xl border border-line bg-bg-elev shadow-card"
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-sm font-medium text-ink">{item.q}</span>
                <ChevronDown
                  className={cn(
                    'size-5 shrink-0 text-ink-3 transition-transform duration-200',
                    isOpen && 'rotate-180',
                  )}
                />
              </button>
              <div
                className={cn(
                  'grid transition-all duration-200',
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
              >
                <div className="overflow-hidden">
                  <p className="border-t border-line px-5 pb-4 pt-3 text-sm leading-7 text-ink-2">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function UpgradeSkeleton() {
  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8 xl:px-10">
      <div className="flex justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="size-11 rounded-xl" />
      </div>
      <Skeleton className="h-20 rounded-xl" />
      <div className="grid gap-5 lg:grid-cols-3">
        <Skeleton className="h-[460px] rounded-2xl" />
        <Skeleton className="h-[460px] rounded-2xl" />
        <Skeleton className="h-[460px] rounded-2xl" />
      </div>
    </div>
  );
}

function PlanCard({
  name,
  subtitle,
  price,
  period,
  features,
  badge,
  featured,
  current,
  cta,
  loading,
  onAction,
}: {
  name: string;
  subtitle: string;
  price: number;
  period: string;
  features: readonly string[];
  badge?: string;
  featured?: boolean;
  current?: boolean;
  cta: string;
  loading?: boolean;
  onAction?: () => void;
}) {
  return (
    <article
      className={cn(
        'relative flex flex-col rounded-2xl border bg-bg-elev p-6 shadow-card sm:p-7',
        featured ? 'border-primary/30 ring-1 ring-primary/10' : 'border-line',
      )}
    >
      {featured ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
          Recommended
        </span>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-ink">{name}</h3>
          <p className="mt-1 text-sm text-ink-2">{subtitle}</p>
        </div>
        {badge ? (
          <Badge variant="outline" className="shrink-0 capitalize">
            {badge}
          </Badge>
        ) : null}
      </div>

      <div className="mt-5 flex items-end gap-1">
        <span className="text-4xl font-bold leading-none tracking-tight text-ink">${price}</span>
        <span className="pb-1 text-sm font-medium text-ink-3">/{period}</span>
      </div>

      <div className="my-6 h-px bg-line" />

      <div className="flex-1">
        <FeatureList items={features} />
      </div>

      {current ? (
        <Button variant="outline" disabled className="mt-8 rounded-full">
          Current plan
        </Button>
      ) : (
        <Button
          className="mt-8 rounded-full"
          variant={featured ? 'primary' : 'soft'}
          loading={loading}
          onClick={onAction}
        >
          {featured ? <Sparkles className="size-4" /> : null}
          {cta}
        </Button>
      )}
    </article>
  );
}

export function UpgradePage() {
  const subscriptionQ = useSubscription();
  const checkoutMut = useCheckout();
  const portalMut = useBillingPortal();
  const [pendingPlan, setPendingPlan] = useState<PaidPlan | null>(null);

  function startCheckout(plan: PaidPlan) {
    setPendingPlan(plan);
    checkoutMut.mutate(plan, { onSettled: () => setPendingPlan(null) });
  }

  if (subscriptionQ.isLoading) return <UpgradeSkeleton />;

  const shellClass = 'w-full space-y-6 p-4 sm:p-6 lg:p-8 xl:px-10';

  if (subscriptionQ.isError) {
    return (
      <div className={shellClass}>
        <div className="rounded-2xl border border-line bg-bg-elev px-6 py-14 text-center shadow-card">
          <p className="text-sm text-ink-2">Couldn&rsquo;t load your subscription.</p>
          <Button variant="soft" className="mt-4 rounded-full px-5" onClick={() => subscriptionQ.refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const subscription = subscriptionQ.data!.subscription;
  const isPremium = subscription.tier === 'premium';
  const isStandard = subscription.tier === 'standard';
  const isPaid = isPremium || isStandard;
  const periodEnd = formatDate(subscription.currentPeriodEnd);
  const trialEnds = formatDate(subscription.trialEndsAt);
  const actionError = checkoutMut.error ?? portalMut.error;
  const standardFeatures = STANDARD_PLAN_FEATURES.slice(1);

  return (
    <div className={shellClass}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {isPaid ? `Your ${isPremium ? 'Premium' : 'Standard'} plan` : 'Upgrade your plan'}
          </h1>
          <p className="mt-2 text-sm leading-7 text-ink-2 sm:text-base">
            {isPaid
              ? 'Manage billing, invoices, and renewal from the Stripe customer portal.'
              : subscription.requiresPayment
                ? 'Your free trial has ended. Subscribe to continue learning and unlock higher limits.'
                : `You are on the ${TRIAL_PERIOD_MONTHS}-month free trial. Upgrade anytime for more assessments, courses, and practice capacity.`}
          </p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-bg-soft text-secondary">
          <Crown className="size-5" />
        </span>
      </div>

      {!isPaid && subscription.trialActive ? (
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary-soft/40 px-5 py-4">
          <Clock className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="font-medium text-ink">
              {subscription.daysRemainingInTrial} days left in your free trial
            </p>
            <p className="mt-1 text-sm leading-6 text-ink-2">
              Trial ends{trialEnds ? ` on ${trialEnds}` : ''}. Premium-only features require a paid
              plan even during the trial.
            </p>
          </div>
        </div>
      ) : null}

      {!isPaid && subscription.requiresPayment ? (
        <div className="rounded-xl border border-bad/20 bg-bad-soft px-5 py-4 text-sm leading-6 text-ink">
          Your {TRIAL_PERIOD_MONTHS}-month trial has ended. Subscribe to Standard or Premium to
          continue creating courses and using AI features.
        </div>
      ) : null}

      {isPaid ? (
        <section className="rounded-2xl border border-line bg-bg-elev p-6 shadow-card sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-ink-2">Current plan</p>
              <p className="mt-2 text-2xl font-bold text-ink">
                {isPremium ? 'Premium' : 'Standard'}
              </p>
              {periodEnd ? (
                <p className="mt-2 text-sm text-ink-2">
                  {subscription.cancelAtPeriodEnd
                    ? `Access until ${periodEnd}`
                    : `Renews on ${periodEnd}`}
                </p>
              ) : null}
            </div>
            <Badge variant={statusVariant(subscription.status)} className="capitalize">
              {subscription.status.replace('_', ' ')}
            </Badge>
          </div>

          {subscription.cancelAtPeriodEnd ? (
            <div className="mt-5 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-ink">
              Your subscription is set to cancel at the end of the current billing period.
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              variant="soft"
              className="rounded-full px-5"
              loading={portalMut.isPending}
              onClick={() => portalMut.mutate()}
            >
              Manage billing
            </Button>
          </div>
        </section>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <PlanCard
            name="Free"
            subtitle={`${TRIAL_PERIOD_MONTHS}-month trial`}
            price={0}
            period={`${TRIAL_PERIOD_MONTHS} months`}
            features={FREE_PLAN_FEATURES}
            badge={
              subscription.trialActive
                ? 'Active trial'
                : subscription.requiresPayment
                  ? 'Expired'
                  : 'Trial'
            }
            current
            cta="Current plan"
          />
          <PlanCard
            name="Standard"
            subtitle="For regular learners"
            price={STANDARD_PRICE_USD}
            period="month"
            features={standardFeatures}
            cta={subscription.requiresPayment ? 'Subscribe to Standard' : 'Choose Standard'}
            loading={pendingPlan === 'standard'}
            onAction={() => startCheckout('standard')}
          />
          <PlanCard
            name="Premium"
            subtitle="For power learners"
            price={PREMIUM_PRICE_USD}
            period="month"
            features={PREMIUM_PLAN_FEATURES}
            featured
            cta={subscription.requiresPayment ? 'Subscribe to Premium' : 'Upgrade to Premium'}
            loading={pendingPlan === 'premium'}
            onAction={() => startCheckout('premium')}
          />
        </div>
      )}

      {isStandard && !isPremium ? (
        <section className="rounded-2xl border border-primary/30 bg-bg-elev p-6 shadow-card ring-1 ring-primary/10 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-primary">Upgrade to Premium</p>
              <h2 className="mt-1 text-xl font-bold text-ink">Unlock unlimited usage</h2>
              <p className="mt-2 text-sm leading-6 text-ink-2">
                Remove assessment, course, quiz, and exam limits. Get priority AI generation and
                advanced SOC & network labs.
              </p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {PREMIUM_PLAN_FEATURES.slice(0, 4).map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-ink-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={2.5} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="shrink-0 text-center lg:text-right">
              <p className="text-3xl font-bold text-ink">
                ${PREMIUM_PRICE_USD}
                <span className="text-sm font-medium text-ink-3"> / month</span>
              </p>
              <Button
                className="mt-4 rounded-full px-5"
                loading={pendingPlan === 'premium'}
                onClick={() => startCheckout('premium')}
              >
                <Sparkles className="size-4" />
                Upgrade to Premium
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {actionError ? (
        <p className="rounded-xl border border-bad/30 bg-bad-soft px-4 py-3 text-sm text-bad">
          {mutationMessage(actionError)}
        </p>
      ) : null}

      <PlanComparisonTable />

      {!isPaid || isStandard ? (
        <p className="text-center text-sm text-ink-3">
          Secure checkout powered by Stripe. Cancel anytime from your billing portal.
        </p>
      ) : null}

      <UpgradeFaq />
    </div>
  );
}
