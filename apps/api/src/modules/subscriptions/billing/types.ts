// Provider-agnostic billing seam (mirrors the AI provider pattern): the real
// Stripe implementation is injectable so tests run without a Stripe key.

export interface CheckoutParams {
  userId: string;
  email: string;
  customerId?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface PortalParams {
  customerId: string;
  returnUrl: string;
}

export type BillingEventType =
  | 'subscription.activated'
  | 'subscription.updated'
  | 'subscription.canceled'
  | 'ignored';

export type BillingStatus = 'active' | 'canceled' | 'past_due' | 'incomplete';

// A normalized subscription-state change distilled from a provider webhook,
// decoupled from Stripe's exact event/field shapes.
export interface BillingEvent {
  type: BillingEventType;
  userId?: string;
  customerId?: string;
  subscriptionId?: string;
  priceId?: string;
  status?: BillingStatus;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}

export interface BillingProvider {
  createCheckoutSession(params: CheckoutParams): Promise<{ url: string; customerId?: string }>;
  createPortalSession(params: PortalParams): Promise<{ url: string }>;
  // Verifies the webhook signature and returns a normalized event; throws on a bad signature.
  constructEvent(rawBody: Buffer, signature: string): BillingEvent;
  // Fetches a subscription's current normalized state (for reconciliation); null if unavailable.
  fetchSubscription(subscriptionId: string): Promise<BillingEvent | null>;
}
