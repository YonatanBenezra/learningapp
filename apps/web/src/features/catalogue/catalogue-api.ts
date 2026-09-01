import { apiClient } from "@/lib/api-client";
import type { Exercise, ExerciseListResponse } from "@/types/exercise";

export const catalogueApi = {
  list: (pageSize = 200) =>
    apiClient<ExerciseListResponse>(`/exercises?pageSize=${pageSize}`),
  getBySlug: (slug: string) => apiClient<Exercise>(`/exercises/${slug}`),
};
