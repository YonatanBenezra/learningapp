import type { ArenaCategoryId } from "@/lib/arena/categories";
import type { ContestLeaderboard, ContestLeaderboardItem } from "@/types/contest";
import type {
  PodiumPlace,
  ProgressionSeries,
  ScoreCategoryProgress,
  ScoreRow,
  ScoreboardPayload,
} from "@/lib/arena/scoreboard";
import { SCOREBOARD_PAGE_SIZE } from "@/lib/arena/scoreboard";

const CATEGORY_IDS: ArenaCategoryId[] = [
  "prompt-injection",
  "retrieval",
  "guardrails",
  "evals",
  "exfiltration",
];

function categoryProgress(
  solved: number,
  total: number,
): Record<ArenaCategoryId, ScoreCategoryProgress> {
  const ratio = total > 0 ? solved / total : 0;
  return Object.fromEntries(
    CATEGORY_IDS.map((id) => [
      id,
      { solved: Math.round(ratio * 5), total: 5 },
    ]),
  ) as Record<ArenaCategoryId, ScoreCategoryProgress>;
}

function mapItem(item: ContestLeaderboardItem): ScoreRow {
  const elapsed = item.elapsedMs ?? item.rank * 90_000;
  return {
    rank: item.rank,
    user: item.displayName,
    points: item.totalScore,
    flags: item.solvedCount,
    totalFlags: item.totalCount,
    firstBloods: 0,
    lastCaptureAt: new Date(Date.now() - elapsed).toISOString(),
    categories: categoryProgress(item.solvedCount, item.totalCount),
    isYou: item.isYou,
  };
}

const CHART_COLORS = [
  "var(--arena-medal-gold)",
  "var(--arena-medal-silver)",
  "var(--arena-medal-bronze)",
  "var(--arena-cyan)",
  "var(--arena-purple)",
] as const;

function progressionSeries(
  items: ContestLeaderboardItem[],
  me: ContestLeaderboardItem | null,
): ProgressionSeries[] {
  const top = items.filter((i) => !i.isYou).slice(0, 5);
  const rows: ContestLeaderboardItem[] = [...top];
  if (me && !rows.some((r) => r.displayName === me.displayName)) {
    rows.push(me);
  }

  return rows.map((item, index) => {
    const minutes = Math.max(
      1,
      Math.min(180, Math.round((item.elapsedMs ?? 60_000) / 60_000)),
    );
    return {
      user: item.isYou ? "you" : item.displayName,
      color: item.isYou
        ? "var(--arena-lime-fg)"
        : CHART_COLORS[index % CHART_COLORS.length]!,
      isYou: item.isYou,
      points: [
        { t: 0, score: 0 },
        { t: minutes, score: item.totalScore },
      ],
    };
  });
}

function podiumFromItems(items: ContestLeaderboardItem[]): PodiumPlace[] {
  return items.slice(0, 3).map((item, i) => ({
    place: (i + 1) as PodiumPlace["place"],
    user: item.displayName,
    points: item.totalScore,
    firstBloods: 0,
  }));
}

/** Map a contest-scoped API leaderboard into Arena scoreboard UI data. */
export function mapContestLeaderboardToScoreboard(
  pageBoard: ContestLeaderboard,
  opts: {
    topForChart: ContestLeaderboardItem[];
    topForPodium: ContestLeaderboardItem[];
    me: ContestLeaderboardItem | null;
  },
): ScoreboardPayload {
  const rows = pageBoard.items.map(mapItem);
  const meSource =
    opts.me ??
    pageBoard.items.find((i) => i.isYou) ??
    null;
  const meRow = meSource
    ? mapItem({ ...meSource, isYou: true })
    : {
        rank: 0,
        user: "—",
        points: 0,
        flags: 0,
        totalFlags: pageBoard.items[0]?.totalCount ?? 15,
        firstBloods: 0,
        lastCaptureAt: new Date().toISOString(),
        categories: categoryProgress(0, 5),
        isYou: true,
      };

  return {
    slug: pageBoard.contest.slug,
    eventTitle: pageBoard.contest.title,
    operatorsTotal: pageBoard.total,
    rows,
    total: pageBoard.total,
    page: pageBoard.page,
    pageSize: pageBoard.pageSize || SCOREBOARD_PAGE_SIZE,
    me: meRow,
    top3: podiumFromItems(opts.topForPodium),
    series: progressionSeries(opts.topForChart, opts.me),
  };
}
