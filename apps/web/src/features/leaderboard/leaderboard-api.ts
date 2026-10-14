import { apiClient } from "@/lib/api-client";
import type { LeaderboardEntry, LeaderboardResponse } from "@/types/leaderboard";

const EMPTY_TRACK_PASSES: LeaderboardEntry["trackPasses"] = {
  rag: 0,
  eval: 0,
  guard: 0,
  prompt: 0,
};

function normalizeLeaderboardEntry(raw: LeaderboardEntry): LeaderboardEntry {
  return {
    ...raw,
    trackPasses: {
      rag: raw.trackPasses?.rag ?? 0,
      eval: raw.trackPasses?.eval ?? 0,
      guard: raw.trackPasses?.guard ?? 0,
      prompt: raw.trackPasses?.prompt ?? 0,
    },
    streakDays: raw.streakDays ?? 0,
    strongestTracks: raw.strongestTracks ?? [],
  };
}

export const leaderboardApi = {
  list: async () => {
    const body = await apiClient<LeaderboardResponse>("/leaderboard");
    return {
      ...body,
      items: body.items.map(normalizeLeaderboardEntry),
    };
  },
};
