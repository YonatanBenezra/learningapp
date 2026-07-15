import Stripe from 'stripe';
import { env } from '../../../config/env';
import { AppError } from '../../../common/errors/AppError';
import type {
  BillingEvent,
  BillingProvider,
  BillingStatus,
  CheckoutParams,
  PortalParams,
} from './types';

let client: Stripe | null = null;

function getStripe(): Stripe {
  if (!env.stripeSecretKey) {
    throw new AppError(500, 'Stripe is not configured (missing STRIPE_SECRET_KEY).');
  }
  if (!client) client = new Stripe(env.stripeSecretKey);
  return client;
}

export function mapStatus(status: string): BillingStatus {
  if (status === 'active' || status === 'trialing') return 'active';
  if (status === 'past_due') return 'past_due';
  if (status === 'canceled' || status === 'unpaid') return 'canceled';
  return 'incomplete';
}

// Loosely-typed views of the Stripe payloads we read, so we don't couple to the
// exact field locations of a given Stripe API version (the seam normalizes them).
interface StripeSessionLike {
  metadata?: { userId?: string };
  client_reference_id?: string | null;
  customer?: string | null;
  subscription?: string | null;
}
interface StripeSubscriptionLike {
  id: string;
  customer?: string | null;
  status: string;
  metadata?: { userId?: string };
  items?: { data?: Array<{ price?: { id?: string } }> };
  current_period_end?: number;
  cancel_at_period_end?: boolean;
}

// Maps a raw Stripe event to our normalized BillingEvent. Exported for testing —
// it carries the version-sensitive field-location logic that most needs coverage.
export function normalize(event: Stripe.Event): BillingEvent {
  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as unknown as StripeSessionLike;
      return {
        type: 'subscription.activated',
        userId: s.metadata?.userId ?? s.client_reference_id ?? undefined,
        customerId: s.customer ?? undefined,
        subscriptionId: s.subscription ?? undefined,
        status: 'active',
      };
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as unknown as StripeSubscriptionLike;
      return {
        type: 'subscription.updated',
        userId: sub.metadata?.userId ?? undefined,
        customerId: sub.customer ?? undefined,
        subscriptionId: sub.id,
        priceId: sub.items?.data?.[0]?.price?.id,
        status: mapStatus(sub.status),
        currentPeriodEnd: sub.current_period_end
          ? new Date(sub.current_period_end * 1000)
          : undefined,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      };
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as unknown as StripeSubscriptionLike;
      return {
        type: 'subscription.canceled',
        userId: sub.metadata?.userId ?? undefined,
        customerId: sub.customer ?? undefined,
        subscriptionId: sub.id,
        status: 'canceled',
      };
    }
    default:
      return { type: 'ignored' };
  }
}

export class StripeBillingProvider implements BillingProvider {
  async createCheckoutSession(p: CheckoutParams): Promise<{ url: string; customerId?: string }> {
    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: p.priceId, quantity: 1 }],
      customer: p.customerId,
      customer_email: p.customerId ? undefined : p.email,
      client_reference_id: p.userId,
      metadata: { userId: p.userId },
      subscription_data: { metadata: { userId: p.userId } },
      success_url: p.successUrl,
      cancel_url: p.cancelUrl,
    });
    return {
      url: session.url ?? '',
      customerId: typeof session.customer === 'string' ? session.customer : undefined,
    };
  }

  async createPortalSession(p: PortalParams): Promise<{ url: string }> {
    const session = await getStripe().billingPortal.sessions.create({
      customer: p.customerId,
      return_url: p.returnUrl,
    });
    return { url: session.url };
  }

  constructEvent(rawBody: Buffer, signature: string): BillingEvent {
    if (!env.stripeWebhookSecret) {
      throw new AppError(500, 'Stripe webhook secret is not configured.');
    }
    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
    } catch {
      throw new AppError(400, 'Invalid Stripe webhook signature.');
    }
    return normalize(event);
  }

  async fetchSubscription(subscriptionId: string): Promise<BillingEvent | null> {
    let sub: Stripe.Subscription;
    try {
      sub = await getStripe().subscriptions.retrieve(subscriptionId);
    } catch {
      return null;
    }
    // Reuse the updated-event mapping by wrapping the subscription in that shape.
    return normalize({
      type: 'customer.subscription.updated',
      data: { object: sub },
    } as unknown as Stripe.Event);
  }
}

let provider: BillingProvider | null = null;

// Lazy singleton so importing this module never touches the Stripe SDK/network.
export function getBillingProvider(): BillingProvider {
  if (!provider) provider = new StripeBillingProvider();
  return provider;
}
