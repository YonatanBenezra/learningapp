'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import * as exercisesApi from './exercisesApi';

export function useGenerateExercise() {
  return useMutation({ mutationFn: exercisesApi.generateExercise });
}

export function useExercise(exerciseId: string | null) {
  return useQuery({
    queryKey: ['exercise', exerciseId],
    queryFn: () => exercisesApi.getExercise(exerciseId as string),
    enabled: Boolean(exerciseId),
  });
}

export function useSubmitExercise(exerciseId: string) {
  return useMutation({
    mutationFn: (submissionData: unknown) =>
      exercisesApi.submitExercise(exerciseId, submissionData),
  });
}

export function useExerciseSubmission(submissionId: string | null, poll = false) {
  return useQuery({
    queryKey: ['exercise-submission', submissionId],
    queryFn: () => exercisesApi.getExerciseSubmission(submissionId as string),
    enabled: Boolean(submissionId),
    refetchInterval: (query) => {
      if (!poll) return false;
      const status = query.state.data?.status;
      return status === 'submitted' || status === 'grading' ? 1500 : false;
    },
  });
}
