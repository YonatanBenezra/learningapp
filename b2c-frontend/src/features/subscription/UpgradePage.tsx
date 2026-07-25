'use client';

import { Check, Clock, Crown, Sparkles } from 'lucide-react';
import {
  PREMIUM_ONLY_FEATURES,
  PREMIUM_PLAN_FEATURES,
  PREMIUM_PRICE_USD,
  TRIAL_INCLUDED_FEATURES,
  TRIAL_PERIOD_MONTHS,
} from '@/src/constants/pricing';
import { useSubscription, useCheckout, useBillingPortal } from '@/src/features/subscription';
import { ApiError } from '@/src/infrastructure/apiClient';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Skeleton } from '@/src/components/ui/skeleton';
import { cn } from '@/src/lib/utils';

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[20px_1fr] gap-2.5 text-sm text-ink-2">
      <Check className="mt-0.5 size-4 shrink-0 text-good" strokeWidth={2.6} />
      {children}
    </li>
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

function UpgradeSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="mt-2 h-5 w-96" />
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Skeleton className="h-[420px] rounded-2xl" />
        <Skeleton className="h-[420px] rounded-2xl" />
      </div>
    </div>
  );
}

export function UpgradePage() {
  const subscriptionQ = useSubscription();
  const checkoutMut = useCheckout();
  const portalMut = useBillingPortal();

  if (subscriptionQ.isLoading) return <UpgradeSkeleton />;

  if (subscriptionQ.isError) {
    return (
      <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8">
        <div className="rounded-2xl border border-line bg-bg-elev p-10 text-center">
          <p className="text-ink-2">Couldn&rsquo;t load your subscription.</p>
          <Button variant="soft" className="mt-4" onClick={() => subscriptionQ.refetch()}>
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

  return (
    <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <Crown className="size-7 text-secondary" />
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {isPaid ? `Your ${isPremium ? 'Premium' : 'Standard'} plan` : 'Upgrade your plan'}
          </h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-ink-2 sm:text-base">
          {isPaid
            ? 'Manage billing, invoices, and renewal from the Stripe customer portal.'
            : subscription.requiresPayment
              ? 'Your free trial has ended. Subscribe to continue learning and unlock premium features.'
              : `You are on the ${TRIAL_PERIOD_MONTHS}-month free trial. Upgrade anytime for premium-only features.`}
        </p>
      </div>

      {!isPaid && subscription.trialActive ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary-soft px-5 py-4">
          <Clock className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="font-semibold text-ink">
              {subscription.daysRemainingInTrial} days left in your free trial
            </p>
            <p className="mt-1 text-sm text-ink-2">
              Trial ends{trialEnds ? ` on ${trialEnds}` : ''}. After that, subscribe to keep using the
              platform. Premium-only features require a paid plan even during the trial.
            </p>
          </div>
        </div>
      ) : null}

      {!isPaid && subscription.requiresPayment ? (
        <div className="mb-6 rounded-2xl border border-bad/20 bg-bad-soft px-5 py-4 text-sm text-ink">
          Your {TRIAL_PERIOD_MONTHS}-month trial has ended. Subscribe to Premium to continue creating
          courses and using AI features.
        </div>
      ) : null}

      {isPaid ? (
        <section className="rounded-2xl border border-line bg-bg-elev p-6 shadow-soft sm:p-8">
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

          <Button
            className="mt-6"
            variant="soft"
            loading={portalMut.isPending}
            onClick={() => portalMut.mutate()}
          >
            Manage billing
          </Button>
        </section>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          <section className="flex flex-col rounded-2xl border border-line bg-bg-elev p-6 shadow-soft sm:p-8">
            <p className="text-sm font-semibold text-ink-2">Free trial</p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight text-ink">
              $0
              <span className="text-sm font-medium text-ink-3"> / {TRIAL_PERIOD_MONTHS} months</span>
            </p>
            <Badge variant="outline" className="mt-4 w-fit capitalize">
              {subscription.trialActive ? 'Active trial' : subscription.requiresPayment ? 'Expired' : 'Trial'}
            </Badge>
            <ul className="mt-6 flex flex-col gap-2.5">
              {TRIAL_INCLUDED_FEATURES.map((feature) => (
                <Feature key={feature}>{feature}</Feature>
              ))}
            </ul>
          </section>

          <section className="relative flex flex-col rounded-2xl border-2 border-primary bg-bg-elev p-6 shadow-card sm:p-8">
            <span className="absolute -top-3 left-8 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-ink">
              Recommended
            </span>
            <p className="text-sm font-semibold text-ink-2">Premium</p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight text-ink">
              ${PREMIUM_PRICE_USD}
              <span className="text-sm font-medium text-ink-3"> / month</span>
            </p>
            <ul className="mt-6 flex flex-col gap-2.5">
              {PREMIUM_PLAN_FEATURES.map((feature) => (
                <Feature key={feature}>{feature}</Feature>
              ))}
            </ul>
            <div className="mt-4 rounded-xl border border-secondary/20 bg-secondary-soft px-4 py-3 text-sm text-ink-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
                Premium-only
              </p>
              <ul className="mt-2 space-y-1">
                {PREMIUM_ONLY_FEATURES.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
            </div>
            <Button
              className="mt-auto pt-8"
              loading={checkoutMut.isPending}
              onClick={() => checkoutMut.mutate()}
            >
              <Sparkles className="size-4" />
              {subscription.requiresPayment ? 'Subscribe now' : 'Upgrade now'}
            </Button>
          </section>
        </div>
      )}

      {actionError ? (
        <p className={cn('mt-4 text-sm text-bad')}>{mutationMessage(actionError)}</p>
      ) : null}

      {!isPaid ? (
        <p className="mt-6 text-center text-xs text-ink-3">
          Secure checkout powered by Stripe. Cancel anytime from your billing portal.
        </p>
      ) : null}
    </div>
  );
}
