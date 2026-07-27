'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/src/infrastructure/apiClient';
import * as marketplaceApi from './marketplaceApi';

export function useMarketplaceCourses() {
  return useQuery({
    queryKey: ['marketplace', 'courses'],
    queryFn: marketplaceApi.listMarketplaceCourses,
  });
}

export function useMarketplaceCourse(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['marketplace', 'course', id],
    queryFn: () => marketplaceApi.getMarketplaceCourse(id),
    enabled: options?.enabled ?? true,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 2;
    },
  });
}

export function usePurchaseMarketplaceCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: marketplaceApi.purchaseMarketplaceCourse,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      void queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}
