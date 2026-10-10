import { apiClient } from "@/lib/api-client";
import type { Exercise, ExerciseListResponse } from "@/types/exercise";

export type UserExerciseSolveStat = {
  solveRate: number;
  gradedAttempts: number;
  passCount: number;
  cleared: boolean;
};

export type ExerciseProgressResponse = {
  bySlug: Record<string, UserExerciseSolveStat>;
};

export const problemsApi = {
  list: (pageSize = 200) =>
    apiClient<ExerciseListResponse>(`/exercises?pageSize=${pageSize}`),
  getBySlug: (slug: string) => apiClient<Exercise>(`/exercises/${slug}`),
  exerciseProgress: () =>
    apiClient<ExerciseProgressResponse>("/me/exercise-progress"),
};
