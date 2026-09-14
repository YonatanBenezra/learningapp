import { apiClient } from "@/lib/api-client";
import type {
  ContestDetail,
  ContestExercise,
  ContestListResponse,
} from "@/types/contest";
import type { Attempt } from "@/types/attempt";

export const assessmentsApi = {
  list: () => apiClient<ContestListResponse>("/assessments"),
  getBySlug: (slug: string) => apiClient<ContestDetail>(`/assessments/${slug}`),
  enter: (slug: string) =>
    apiClient<ContestDetail>(`/assessments/${slug}/enter`, { method: "POST" }),
  getExercise: (assessmentSlug: string, exerciseSlug: string) =>
    apiClient<ContestExercise>(
      `/assessments/${assessmentSlug}/exercises/${exerciseSlug}`,
    ),
  startAttempt: (assessmentSlug: string, exerciseSlug: string) =>
    apiClient<Attempt & { contestSlug: string }>(
      `/assessments/${assessmentSlug}/attempts`,
      {
        method: "POST",
        body: JSON.stringify({ exerciseSlug }),
      },
    ),
};
