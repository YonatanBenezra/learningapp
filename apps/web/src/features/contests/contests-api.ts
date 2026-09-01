import { apiClient } from "@/lib/api-client";
import type {
  ContestDetail,
  ContestExercise,
  ContestListResponse,
} from "@/types/contest";
import type { Attempt } from "@/types/attempt";

export const contestsApi = {
  list: () => apiClient<ContestListResponse>("/contests"),
  getBySlug: (slug: string) => apiClient<ContestDetail>(`/contests/${slug}`),
  enter: (slug: string) =>
    apiClient<ContestDetail>(`/contests/${slug}/enter`, { method: "POST" }),
  getExercise: (contestSlug: string, exerciseSlug: string) =>
    apiClient<ContestExercise>(
      `/contests/${contestSlug}/exercises/${exerciseSlug}`,
    ),
  startAttempt: (contestSlug: string, exerciseSlug: string) =>
    apiClient<Attempt & { contestSlug: string }>(
      `/contests/${contestSlug}/attempts`,
      {
        method: "POST",
        body: JSON.stringify({ exerciseSlug }),
      },
    ),
};
