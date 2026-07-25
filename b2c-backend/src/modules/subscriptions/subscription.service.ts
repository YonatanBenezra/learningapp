import { Subscription } from './subscription.model';
import { User } from '../users/user.model';
import { AppError } from '../../common/errors/AppError';
import { logger } from '../../common/utils/logger';
import { env } from '../../config/env';
import { TRIAL_PERIOD_DAYS } from '../../config/constants';
import { isPaidTier, type Tier } from '../../config/tiers';
import { getBillingProvider } from './billing/stripe.provider';
import type { BillingEvent, BillingProvider } from './billing/types';

const TRIAL_MS = TRIAL_PERIOD_DAYS * 24 * 60 * 60 * 1000;

function defaultTrialEndsAt(from = new Date()): Date {
  return new Date(from.getTime() + TRIAL_MS);
}

export function isTrialActive(
  sub: { trialEndsAt?: Date | null },
  now = new Date(),
): boolean {
  return Boolean(sub.trialEndsAt && sub.trialEndsAt > now);
}

export function hasPlatformAccess(
  sub: { tier: string; trialEndsAt?: Date | null },
  now = new Date(),
): boolean {
  return isPaidTier(sub.tier) || isTrialActive(sub, now);
}

function resolvePaidTierFromPrice(priceId?: string | null): Tier {
  if (priceId) {
    if (env.stripePriceId && priceId === env.stripePriceId) return 'premium';
    if (env.stripeStandardPriceId && priceId === env.stripeStandardPriceId) return 'standard';
  }
  // Backward compatible: legacy single-price setups map to Premium.
  if (env.stripePriceId && !env.stripeStandardPriceId) return 'premium';
  return 'standard';
}

export function serializeSubscription(
  sub: InstanceType<typeof Subscription>,
  now = new Date(),
) {
  const json = sub.toJSON() as Record<string, unknown>;
  const trialActive = isTrialActive(sub, now);
  const platformAccess = hasPlatformAccess(sub, now);
  const daysRemainingInTrial =
    trialActive && sub.trialEndsAt
      ? Math.max(0, Math.ceil((sub.trialEndsAt.getTime() - now.getTime()) / 86_400_000))
      : 0;

  return {
    ...json,
    trialActive,
    platformAccess,
    requiresPayment: !platformAccess,
    daysRemainingInTrial,
  };
}

async function backfillTrialEndsAt(
  sub: InstanceType<typeof Subscription>,
): Promise<InstanceType<typeof Subscription>> {
  if (sub.trialEndsAt) return sub;
  const user = await User.findById(sub.userId).select('createdAt');
  sub.trialEndsAt = defaultTrialEndsAt(user?.createdAt ?? sub.createdAt ?? new Date());
  await sub.save();
  return sub;
}

// Every user has exactly one subscription record; free is the default.
export async function getOrCreateSubscription(userId: string) {
  const existing = await Subscription.findOne({ userId });
  if (existing) return backfillTrialEndsAt(existing);
  return Subscription.create({
    userId,
    tier: 'free',
    status: 'active',
    trialEndsAt: defaultTrialEndsAt(),
  });
}

export async function assertPlatformAccess(userId: string, now = new Date()): Promise<void> {
  const sub = await getOrCreateSubscription(userId);
  if (!hasPlatformAccess(sub, now)) {
    throw new AppError(
      402,
      `Your ${TRIAL_PERIOD_DAYS}-day free trial has ended. Subscribe to continue learning.`,
    );
  }
}

export async function createCheckout(
  userId: string,
  provider: BillingProvider = getBillingProvider(),
  plan: 'standard' | 'premium' = 'premium',
): Promise<{ url: string }> {
  const priceId =
    plan === 'standard'
      ? env.stripeStandardPriceId || env.stripePriceId
      : env.stripePriceId;
  if (!priceId) throw new AppError(500, 'Stripe price is not configured.');
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  const sub = await getOrCreateSubscription(userId);
  const { url, customerId } = await provider.createCheckoutSession({
    userId,
    email: user.email as string,
    customerId: sub.stripeCustomerId ?? undefined,
    priceId,
    successUrl: env.stripeSuccessUrl,
    cancelUrl: env.stripeCancelUrl,
  });

  if (customerId && !sub.stripeCustomerId) {
    sub.stripeCustomerId = customerId;
    await sub.save();
  }
  return { url };
}

export async function createPortal(
  userId: string,
  provider: BillingProvider = getBillingProvider(),
): Promise<{ url: string }> {
  const sub = await Subscription.findOne({ userId });
  if (!sub?.stripeCustomerId) {
    throw new AppError(400, 'No billing account yet — start a subscription first.');
  }
  return provider.createPortalSession({
    customerId: sub.stripeCustomerId,
    returnUrl: env.stripeSuccessUrl,
  });
}

// Single source of truth for tier changes. Applies a normalized billing event to
// the Subscription record AND mirrors the tier onto User.tier (the fast-path field
// read by course entitlement + quota). Downgrades therefore re-apply free caps.
export async function handleBillingEvent(event: BillingEvent) {
  if (event.type === 'ignored') return null;

  const query = event.userId
    ? { userId: event.userId }
    : event.customerId
      ? { stripeCustomerId: event.customerId }
      : null;
  if (!query) {
    logger.warn({ eventType: event.type }, 'Billing event has no userId/customerId — skipped');
    return null;
  }

  // Paid access continues through the dunning grace period (past_due); only an
  // explicit cancellation / unpaid subscription drops the user back to free.
  const retainsPaidAccess = event.status === 'active' || event.status === 'past_due';
  const isActive = event.type !== 'subscription.canceled' && retainsPaidAccess;
  const tier: Tier = isActive ? resolvePaidTierFromPrice(event.priceId) : 'free';
  const status = event.status ?? (isActive ? 'active' : 'canceled');

  const sub = await Subscription.findOneAndUpdate(
    query,
    {
      $set: {
        tier,
        status,
        ...(event.customerId ? { stripeCustomerId: event.customerId } : {}),
        ...(event.subscriptionId ? { stripeSubscriptionId: event.subscriptionId } : {}),
        ...(event.priceId ? { priceId: event.priceId } : {}),
        ...(event.currentPeriodEnd ? { currentPeriodEnd: event.currentPeriodEnd } : {}),
        ...(event.cancelAtPeriodEnd !== undefined
          ? { cancelAtPeriodEnd: event.cancelAtPeriodEnd }
          : {}),
      },
    },
    { new: true, upsert: Boolean(event.userId) },
  );

  if (sub) {
    await User.updateOne({ _id: sub.userId }, { tier });
    logger.info({ userId: String(sub.userId), tier, status }, 'Subscription tier synced');
  }
  return sub;
}

export async function processStripeWebhook(
  rawBody: Buffer,
  signature: string,
  provider: BillingProvider = getBillingProvider(),
) {
  const event = provider.constructEvent(rawBody, signature);
  return handleBillingEvent(event);
}

// Reconciliation safety net (§7): webhooks are the primary sync path, but a missed
// webhook would leave the DB drifted from Stripe. This job re-fetches each linked
// subscription's current state and re-applies it (idempotent). Returns the number
// whose tier actually changed (drift corrected).
export async function reconcileSubscriptions(
  provider: BillingProvider = getBillingProvider(),
): Promise<number> {
  const subs = await Subscription.find({
    stripeSubscriptionId: { $ne: null },
  }).select('userId stripeSubscriptionId tier');

  let corrected = 0;
  for (const sub of subs) {
    const subscriptionId = sub.get('stripeSubscriptionId') as string | undefined;
    if (!subscriptionId) continue;

    let event: BillingEvent | null;
    try {
      event = await provider.fetchSubscription(subscriptionId);
    } catch (err) {
      logger.error({ err, subscriptionId }, 'Subscription reconcile fetch failed');
      continue;
    }
    if (!event) continue;

    const before = sub.get('tier');
    await handleBillingEvent({ ...event, userId: event.userId ?? String(sub.get('userId')) });
    const after = (await Subscription.findById(sub._id))?.get('tier');
    if (before !== after) corrected += 1;
  }

  logger.info({ corrected, checked: subs.length }, 'Subscription reconciliation complete');
  return corrected;
}
