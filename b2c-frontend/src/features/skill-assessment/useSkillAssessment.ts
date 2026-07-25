'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SubmittedAnswer } from '@/src/domain/assessment';
import { useAuthHydrated } from '@/src/features/auth/useAuthHydrated';
import { useAuthStore } from '@/src/store/authStore';
import * as api from './skillAssessmentApi';

export function useMySkillAssessments() {
  const hydrated = useAuthHydrated();
  const userId = useAuthStore((s) => s.user?.id);
  const guestSessionId = typeof window !== 'undefined' ? api.getGuestSessionId() : '';
  return useQuery({
    queryKey: ['skill-assessments-mine', userId ?? 'guest', guestSessionId],
    queryFn: () => api.listMySkillAssessments(),
    enabled: hydrated,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}

export function useGenerateSkillAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.generateSkillAssessment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['skill-assessments-mine'] });
    },
  });
}

export function useSkillAssessment(id: string) {
  return useQuery({
    queryKey: ['skill-assessment', id],
    queryFn: () => api.getSkillAssessment(id),
    enabled: Boolean(id),
    refetchInterval: (query) =>
      query.state.data?.status === 'generating' ? 1500 : false,
  });
}

export function useSubmitSkillAssessment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (answers: SubmittedAnswer[]) => api.submitSkillAssessment(id, answers),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['skill-assessments-mine'] });
      void queryClient.invalidateQueries({ queryKey: ['skill-assessment-result', id] });
    },
  });
}

export function useSkillAssessmentResult(id: string, enabled = true) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['skill-assessment-result', id],
    queryFn: () => api.getSkillAssessmentResult(id),
    enabled: Boolean(id) && enabled && Boolean(token),
    retry: false,
  });
}
