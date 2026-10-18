import { apiClient } from "@/lib/api-client";
import { apiUrl } from "@/lib/env";
import type {
  ContestDetail,
  ContestExercise,
  ContestLeaderboard,
  ContestListResponse,
  ContestVirtualDetail,
} from "@/types/contest";
import type { Attempt } from "@/types/attempt";

export const contestsApi = {
  list: () => apiClient<ContestListResponse>("/contests"),
  getBySlug: (slug: string) => apiClient<ContestDetail>(`/contests/${slug}`),
  leaderboard: (slug: string, page = 1, pageSize = 50) =>
    apiClient<ContestLeaderboard>(
      `/contests/${encodeURIComponent(slug)}/leaderboard?page=${page}&pageSize=${pageSize}`,
    ),
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
  getVirtual: (slug: string) =>
    apiClient<ContestVirtualDetail>(`/contests/${slug}/virtual`),
  getVirtualExercise: (contestSlug: string, exerciseSlug: string) =>
    apiClient<ContestExercise>(
      `/contests/${contestSlug}/virtual/exercises/${exerciseSlug}`,
    ),
  startVirtualAttempt: (contestSlug: string, exerciseSlug: string) =>
    apiClient<Attempt & { contestSlug: string; mode: "virtual" }>(
      `/contests/${contestSlug}/virtual/attempts`,
      {
        method: "POST",
        body: JSON.stringify({ exerciseSlug }),
      },
    ),
  leaderboardExportUrl: (slug: string) =>
    `${apiUrl()}/contests/${encodeURIComponent(slug)}/leaderboard/export.csv`,
};
