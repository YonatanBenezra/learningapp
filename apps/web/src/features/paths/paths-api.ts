import { apiClient } from "@/lib/api-client";
import type { PathDetail, PathListResponse } from "@/types/path";

export const pathsApi = {
  list: () => apiClient<PathListResponse>("/paths"),
  getBySlug: (slug: string) => apiClient<PathDetail>(`/paths/${slug}`),
};
