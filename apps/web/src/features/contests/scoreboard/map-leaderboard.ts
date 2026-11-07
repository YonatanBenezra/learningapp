import type { ContestLeaderboardItem } from "@/types/contest";
import { buildSeriesFromLeaderboardItem } from "./build-series";
import type { ScoreboardEntry } from "./types";

export function mapLeaderboardItem(
  item: ContestLeaderboardItem,
  nowMs = Date.now(),
): ScoreboardEntry {
  const base = {
    id: item.profileSlug ?? `rank-${item.rank}`,
    rank: item.rank,
    name: item.displayName,
    country: "",
    points: item.totalScore,
    solved: item.solvedCount,
    total: item.totalCount,
    isYou: item.isYou,
    elapsedMs: item.elapsedMs,
  };
  return {
    ...base,
    series: buildSeriesFromLeaderboardItem(item, nowMs),
  };
}

export function mapLeaderboardPage(
  items: ContestLeaderboardItem[],
  nowMs = Date.now(),
): ScoreboardEntry[] {
  return items.map((item) => mapLeaderboardItem(item, nowMs));
}
