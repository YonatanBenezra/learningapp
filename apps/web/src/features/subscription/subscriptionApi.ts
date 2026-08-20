import { apiClient } from '@/src/infrastructure/apiClient';
import type { Tier } from '@/src/domain/user';

export interface Subscription {
  tier: Tier;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  trialEndsAt?: string | null;
  trialActive?: boolean;
  platformAccess?: boolean;
  requiresPayment?: boolean;
  daysRemainingInTrial?: number;
}

export function getMySubscription(): Promise<{ subscription: Subscription }> {
  return apiClient<{ subscription: Subscription }>('/subscriptions/me');
}

export function createCheckout(plan: 'standard' | 'premium' = 'premium'): Promise<{ url: string }> {
  return apiClient<{ url: string }>('/subscriptions/checkout', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  });
}

export function createPortal(): Promise<{ url: string }> {
  return apiClient<{ url: string }>('/subscriptions/portal', { method: 'POST' });
}
