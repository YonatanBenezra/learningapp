import { apiClient } from "@/lib/api-client";
import type { Exercise } from "@/types/exercise";

export const catalogueApi = {
  list: () => apiClient<Exercise[]>("/exercises"),
  getBySlug: (slug: string) => apiClient<Exercise>(`/exercises/${slug}`),
};
