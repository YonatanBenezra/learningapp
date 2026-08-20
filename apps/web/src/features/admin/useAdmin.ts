'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as adminApi from './adminApi';
import type { ContentType } from './adminApi';
import type { Role } from '@/src/domain/user';

export function useAdminMetrics() {
  return useQuery({ queryKey: ['admin', 'metrics'], queryFn: adminApi.getMetrics });
}

export function useAdminCosts() {
  return useQuery({ queryKey: ['admin', 'costs'], queryFn: adminApi.getCosts });
}

export function useAdminActivity() {
  return useQuery({ queryKey: ['admin', 'activity'], queryFn: adminApi.getActivity });
}

export function useAdminSystem() {
  return useQuery({ queryKey: ['admin', 'system'], queryFn: adminApi.getSystem });
}

export function useAdminSubscriptions() {
  return useQuery({ queryKey: ['admin', 'subscriptions'], queryFn: adminApi.getSubscriptions });
}

export function useAdminAssessmentsDashboard() {
  return useQuery({
    queryKey: ['admin', 'assessments-dashboard'],
    queryFn: adminApi.getAssessmentsDashboard,
  });
}

export function useAdminMarketplace() {
  return useQuery({
    queryKey: ['admin', 'marketplace'],
    queryFn: adminApi.getMarketplaceDashboard,
  });
}

export function useAdminMarketplaceCourse(courseId: string) {
  return useQuery({
    queryKey: ['admin', 'marketplace', 'course', courseId],
    queryFn: () => adminApi.getMarketplaceCourse(courseId),
    enabled: Boolean(courseId),
  });
}

export function useAdminUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
  tier?: string;
}) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminApi.listUsers(params),
  });
}

export function useSetUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { userId: string; role: Role }) =>
      adminApi.setUserRole(input.userId, input.role),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useAdminAchievements() {
  return useQuery({
    queryKey: ['admin', 'achievements'],
    queryFn: adminApi.listAchievements,
  });
}

export function useUpsertAchievement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.upsertAchievement,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'achievements'] });
    },
  });
}

export function useAdminNotifications(page = 1) {
  return useQuery({
    queryKey: ['admin', 'notifications', page],
    queryFn: () => adminApi.listAdminNotifications(page),
  });
}

export function useBroadcastNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.broadcastNotification,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
    },
  });
}

export function useAdminContent(type: ContentType, page = 1) {
  return useQuery({
    queryKey: ['admin', 'content', type, page],
    queryFn: () => adminApi.listContent(type, page),
  });
}

export function useAdminFlags(status?: 'open' | 'resolved' | 'dismissed') {
  return useQuery({
    queryKey: ['admin', 'flags', status ?? 'all'],
    queryFn: () => adminApi.listFlags(status),
  });
}

export function useFlagContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { type: ContentType; id: string; reason: string }) =>
      adminApi.flagContent(input.type, input.id, input.reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'flags'] });
    },
  });
}

export function useRegenerateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { type: ContentType; id: string }) =>
      adminApi.regenerateContent(input.type, input.id),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', variables.type] });
    },
  });
}

export function useResolveFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { flagId: string; resolution: 'resolved' | 'dismissed' }) =>
      adminApi.resolveFlag(input.flagId, input.resolution),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'flags'] });
    },
  });
}
