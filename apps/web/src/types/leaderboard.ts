export type LeaderboardTrackKey = "rag" | "eval" | "guard" | "prompt";

export type LeaderboardEntry = {
  rank: number;
  slug: string;
  displayName: string;
  solves: number;
  recentPasses: number;
  rating: number;
  streakDays?: number;
  trackPasses?: Record<LeaderboardTrackKey, number>;
  strongestTracks?: LeaderboardTrackKey[];
};

export type LeaderboardResponse = {
  rule: string;
  items: LeaderboardEntry[];
};
