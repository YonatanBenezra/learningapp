import { formatOperationElapsed } from "@/features/contests/contest-elapsed";
import type { ContestLeaderboardItem } from "@/types/contest";
import type { ActivityRow, AroundYouRow } from "./play-types";

function activityAgo(item: ContestLeaderboardItem): string {
  if (item.status === "finished") {
    return "Finished";
  }
  if (item.status === "expired") {
    return "Time expired";
  }
  if (item.elapsedMs != null && item.elapsedMs > 0) {
    return formatOperationElapsed(item.elapsedMs);
  }
  return "Active";
}

/** Leaderboard snapshot as activity rows (no per-flag timeline until activity API). */
export function activityFromLeaderboard(
  items: ContestLeaderboardItem[],
  limit = 10,
): ActivityRow[] {
  return items
    .filter((row) => row.solvedCount > 0 || row.totalScore > 0)
    .slice(0, limit)
    .map((row) => ({
      id: `lb-${row.rank}-${row.profileSlug ?? row.displayName}`,
      user: row.displayName,
      isYou: row.isYou,
      kind: row.rank === 1 && row.solvedCount > 0 ? "firstBlood" : "capture",
      challenge:
        row.solvedCount > 0
          ? `${row.solvedCount}/${row.totalCount} flags`
          : "Joined the operation",
      points: row.totalScore > 0 ? row.totalScore : undefined,
      ago: activityAgo(row),
    }));
}

export function aroundYouFromLeaderboard(
  items: ContestLeaderboardItem[],
  total: number,
): AroundYouRow[] {
  const idx = items.findIndex((r) => r.isYou);
  if (idx >= 0) {
    return items.slice(Math.max(0, idx - 2), idx + 3).map((r) => ({
      rank: r.rank,
      name: r.displayName,
      score: r.totalScore,
      isYou: r.isYou,
    }));
  }
  if (total > 0 && items.length > 0) {
    return items.slice(0, Math.min(5, items.length)).map((r) => ({
      rank: r.rank,
      name: r.displayName,
      score: r.totalScore,
      isYou: r.isYou,
    }));
  }
  return [];
}
