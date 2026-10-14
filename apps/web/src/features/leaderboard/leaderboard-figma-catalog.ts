import type { LeaderboardEntry } from "@/types/leaderboard";

/** Shown under the page title and in the “How ranking works” card (Figma copy). */
export const LEADERBOARD_SUMMARY_COPY =
  "Unique problems first, recent activity breaks ties.";

export const LEADERBOARD_PAGE_SUBTITLE =
  "Ranked by unique problems passed, then passes in the last 30 days. Only hidden-set passes count.";

/** First problem CTA on open podium slot #2 (Figma). */
export const PODIUM_OPEN_SPOT_START_SLUG = "rag-003-retrieval-top-k";

export const PODIUM_OPEN_SPOT_MESSAGE =
  "This spot is open. Pass one problem on the hidden set to take it.";

export const LEADERBOARD_SPARSE_TABLE_TITLE =
  "Ranks 4+ appear as more learners pass problems";

export const LEADERBOARD_SPARSE_TABLE_BODY =
  "The table fills in automatically. Share LabPath with your team to start a real race.";

export type AvatarTone = "blue" | "teal" | "ember" | "amber" | "neutral";
export type TrackId = "rag" | "eval" | "guard" | "prompt";
export type PeriodFilter = "30d" | "season" | "all";
export type TrackFilter = "all" | TrackId;

export const TRACK_FILTER_OPTIONS: { id: TrackFilter; label: string }[] = [
  { id: "all", label: "All tracks" },
  { id: "rag", label: "RAG" },
  { id: "eval", label: "Eval" },
  { id: "guard", label: "Guard" },
  { id: "prompt", label: "Prompt" },
];

export type Trend = {
  dir: "up" | "down" | "flat";
  delta: number;
};

export type RankingRow = {
  id: string;
  rank: number;
  name: string;
  handle: string;
  initials: string;
  tone: AvatarTone;
  solves: number;
  recent: number;
  rating: number;
  trackPasses: Record<TrackId, number>;
  trend: Trend;
  isYou?: boolean;
};

export type PodiumLearner = {
  rank: 1 | 2 | 3;
  id: string;
  name: string;
  handle: string;
  initials: string;
  tone: AvatarTone;
  rating: number;
  solves: number;
  recent: number;
  streakDays: number;
  trackPasses: Record<TrackId, number>;
  strongestTracks: TrackId[];
};

export const TRACK_LABELS: Record<TrackId, string> = {
  rag: "RAG",
  eval: "Eval",
  guard: "Guard",
  prompt: "Prompt",
};

export const TRACK_COLORS: Record<TrackId, string> = {
  rag: "var(--ember)",
  eval: "var(--blue)",
  guard: "var(--teal)",
  prompt: "var(--amber)",
};

export const TRACK_ORDER: TrackId[] = ["rag", "eval", "guard", "prompt"];

/** Suggested next problem in the YOU-row CTA (Figma). */
export const LEADERBOARD_NEXT_GOAL = {
  id: "P1-R3",
  slug: "rag-003-retrieval-top-k",
  title: "Retrieval Top-K Baseline",
  solveRate: 70,
} as const;

/** Illustrative trend until historical rank API exists. */
export function displayTrendForSlug(slug: string): Trend {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash + slug.charCodeAt(i)) % 101;
  }
  if (hash % 6 === 0) {
    return { dir: "flat", delta: 0 };
  }
  if (hash % 2 === 0) {
    return { dir: "up", delta: (hash % 4) + 1 };
  }
  return { dir: "down", delta: (hash % 3) + 1 };
}

const AVATAR_TONES: AvatarTone[] = ["blue", "teal", "ember", "amber", "neutral"];

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function toneFromSlug(slug: string): AvatarTone {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash + slug.charCodeAt(i)) % AVATAR_TONES.length;
  }
  return AVATAR_TONES[hash] ?? "neutral";
}

export function mapLeaderboardEntry(entry: LeaderboardEntry, isYou = false): RankingRow {
  const trackPasses = entry.trackPasses ?? { rag: 0, eval: 0, guard: 0, prompt: 0 };
  return {
    id: entry.slug,
    rank: entry.rank,
    name: entry.displayName,
    handle: `@${entry.slug}`,
    initials: initialsFromName(entry.displayName),
    tone: toneFromSlug(entry.slug),
    solves: entry.solves,
    recent: entry.recentPasses,
    rating: entry.rating,
    trackPasses,
    trend: displayTrendForSlug(entry.slug),
    isYou,
  };
}

/** Visual order on the podium row (#2 · #1 · #3). */
export const PODIUM_SLOT_ORDER: Array<1 | 2 | 3> = [2, 1, 3];

export type PodiumSlot =
  | { kind: "learner"; learner: PodiumLearner }
  | { kind: "soon"; rank: 1 | 2 | 3 };

export function buildPodiumSlots(topThree: LeaderboardEntry[]): PodiumSlot[] {
  const byRank = new Map(topThree.filter((r) => r.rank <= 3).map((row) => [row.rank, row]));
  return PODIUM_SLOT_ORDER.map((rank) => {
    const entry = byRank.get(rank);
    if (entry) {
      return { kind: "learner" as const, learner: mapPodiumEntry(entry) };
    }
    return { kind: "soon" as const, rank };
  });
}

export function mapPodiumEntry(entry: LeaderboardEntry): PodiumLearner {
  const trackPasses = entry.trackPasses ?? { rag: 0, eval: 0, guard: 0, prompt: 0 };
  const strongestTracks =
    entry.strongestTracks && entry.strongestTracks.length > 0
      ? entry.strongestTracks
      : (Object.entries(trackPasses) as [TrackId, number][])
          .filter(([, n]) => n > 0)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([key]) => key);

  return {
    rank: entry.rank as 1 | 2 | 3,
    id: entry.slug,
    name: entry.displayName,
    handle: `@${entry.slug}`,
    initials: initialsFromName(entry.displayName),
    tone: toneFromSlug(entry.slug),
    rating: entry.rating,
    solves: entry.solves,
    recent: entry.recentPasses,
    streakDays: entry.streakDays ?? 0,
    trackPasses,
    strongestTracks,
  };
}

export function sortEntriesForPeriod(
  items: LeaderboardEntry[],
  period: PeriodFilter,
): LeaderboardEntry[] {
  const copy = [...items];
  if (period === "all") {
    copy.sort((a, b) => b.rating - a.rating || b.solves - a.solves);
  } else if (period === "season") {
    copy.sort((a, b) => b.solves - a.solves || b.rating - a.rating);
  } else {
    copy.sort(
      (a, b) =>
        b.solves - a.solves || b.recentPasses - a.recentPasses || a.slug.localeCompare(b.slug),
    );
  }
  return copy.map((row, index) => ({ ...row, rank: index + 1 }));
}
