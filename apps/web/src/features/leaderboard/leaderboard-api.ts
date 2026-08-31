import { apiClient } from "@/lib/api-client";
import type { LeaderboardResponse } from "@/types/leaderboard";

export const leaderboardApi = {
  list: () => apiClient<LeaderboardResponse>("/leaderboard"),
};
