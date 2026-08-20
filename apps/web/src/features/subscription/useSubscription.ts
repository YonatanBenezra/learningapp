'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthHydrated } from '@/src/features/auth/useAuthHydrated';
import { useAuthStore } from '@/src/store/authStore';
import * as subscriptionApi from './subscriptionApi';

export function useSubscription() {
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  return useQuery({
    queryKey: ['subscription', 'me'],
    queryFn: subscriptionApi.getMySubscription,
    enabled: hydrated && isAuthenticated,
  });
}

// Redirect the browser to Stripe Checkout / the customer portal.
export function useCheckout() {
  return useMutation({
    mutationFn: subscriptionApi.createCheckout,
    onSuccess: ({ url }) => {
      if (url) window.location.href = url;
    },
  });
}

export function useBillingPortal() {
  return useMutation({
    mutationFn: subscriptionApi.createPortal,
    onSuccess: ({ url }) => {
      if (url) window.location.href = url;
    },
  });
}
