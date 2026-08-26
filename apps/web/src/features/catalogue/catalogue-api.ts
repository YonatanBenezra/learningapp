import { apiClient } from "@/lib/api-client";
import type { Exercise, ExerciseListResponse } from "@/types/exercise";

export const catalogueApi = {
  list: () => apiClient<ExerciseListResponse>("/exercises"),
  getBySlug: (slug: string) => apiClient<Exercise>(`/exercises/${slug}`),
};
