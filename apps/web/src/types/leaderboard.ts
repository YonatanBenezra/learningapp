export type LeaderboardEntry = {
  rank: number;
  slug: string;
  displayName: string;
  solves: number;
  recentPasses: number;
  rating: number;
};

export type LeaderboardResponse = {
  rule: string;
  items: LeaderboardEntry[];
};
