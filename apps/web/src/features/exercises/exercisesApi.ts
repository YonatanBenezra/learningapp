import { apiClient } from '@/src/infrastructure/apiClient';
import type { Exercise, ExerciseSubmission } from '@/src/domain/exercise';

export function generateExercise(lessonId: string) {
  return apiClient<{ exercise: Exercise }>(`/lessons/${lessonId}/exercises`, {
    method: 'POST',
  }).then((r) => r.exercise);
}

export function getExercise(exerciseId: string) {
  return apiClient<{ exercise: Exercise }>(`/exercises/${exerciseId}`).then((r) => r.exercise);
}

export function submitExercise(exerciseId: string, submissionData: unknown) {
  return apiClient<{ submission: ExerciseSubmission }>(`/exercises/${exerciseId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ submissionData }),
  }).then((r) => r.submission);
}

export function getExerciseSubmission(submissionId: string) {
  return apiClient<{ submission: ExerciseSubmission }>(`/exercises/submissions/${submissionId}`).then(
    (r) => r.submission,
  );
}
