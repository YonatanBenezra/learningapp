'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useAuthHydrated } from '@/src/features/auth/useAuthHydrated';
import {
  hasCompletedAssessment,
  isAssessmentCompleteLocal,
  markAssessmentComplete,
  subscribeAssessmentComplete,
} from './assessmentGate';
import { useMySkillAssessments } from './useSkillAssessment';

function useAssessmentCompleteLocal(): boolean {
  return useSyncExternalStore(
    subscribeAssessmentComplete,
    isAssessmentCompleteLocal,
    () => false,
  );
}

export function useAssessmentGate() {
  const hydrated = useAuthHydrated();
  const localComplete = useAssessmentCompleteLocal();
  const { data, isLoading, isFetching } = useMySkillAssessments();

  const apiComplete = data?.assessments.some((a) => a.status === 'completed') ?? false;

  useEffect(() => {
    if (apiComplete && !localComplete) {
      markAssessmentComplete();
    }
  }, [apiComplete, localComplete]);

  const completed = localComplete || apiComplete || hasCompletedAssessment(data?.assessments);
  const loading = !hydrated || ((isLoading || isFetching) && !completed);

  return { completed, loading };
}
