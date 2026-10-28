import type { ArenaCategoryId } from "@/lib/arena/categories";
import { ARENA_CATEGORIES } from "@/lib/arena/categories";

export type ScoreCategoryProgress = { solved: number; total: number };

export type ScoreRow = {
  rank: number;
  user: string;
  points: number;
  flags: number;
  totalFlags: number;
  firstBloods: number;
  lastCaptureAt: string;
  categories: Record<ArenaCategoryId, ScoreCategoryProgress>;
  isYou?: boolean;
};

export type PodiumPlace = {
  place: 1 | 2 | 3;
  user: string;
  points: number;
  firstBloods: number;
};

export type ProgressionPoint = { t: number; score: number };

export type ProgressionSeries = {
  user: string;
  color: string;
  points: ProgressionPoint[];
  isYou?: boolean;
};

export type ScoreboardPayload = {
  slug: string;
  eventTitle: string;
  operatorsTotal: number;
  rows: ScoreRow[];
  total: number;
  page: number;
  pageSize: number;
  me: ScoreRow;
  top3: PodiumPlace[];
  series: ProgressionSeries[];
};

export const SCOREBOARD_PAGE_SIZE = 50;

const CATEGORY_IDS = Object.keys(ARENA_CATEGORIES) as ArenaCategoryId[];

function cat(fill: number, total = 5): ScoreCategoryProgress {
  return { solved: Math.round(fill * total), total };
}

function rowCategories(
  fills: [number, number, number, number, number],
): Record<ArenaCategoryId, ScoreCategoryProgress> {
  const ids: ArenaCategoryId[] = [
    "prompt-injection",
    "retrieval",
    "guardrails",
    "evals",
    "exfiltration",
  ];
  return Object.fromEntries(
    ids.map((id, i) => [id, cat(fills[i] ?? 0)]),
  ) as Record<ArenaCategoryId, ScoreCategoryProgress>;
}

const MOCK_TABLE: Omit<ScoreRow, "isYou">[] = [
  {
    rank: 1,
    user: "nadia.k",
    points: 4820,
    flags: 14,
    totalFlags: 15,
    firstBloods: 4,
    lastCaptureAt: new Date(Date.now() - 2 * 60_000).toISOString(),
    categories: rowCategories([1, 1, 0.95, 1, 0.9]),
  },
  {
    rank: 2,
    user: "rafi_dev",
    points: 4412,
    flags: 13,
    totalFlags: 15,
    firstBloods: 3,
    lastCaptureAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    categories: rowCategories([1, 0.95, 0.87, 1, 0.8]),
  },
  {
    rank: 3,
    user: "tanvir.ml",
    points: 4180,
    flags: 13,
    totalFlags: 15,
    firstBloods: 2,
    lastCaptureAt: new Date(Date.now() - 11 * 60_000).toISOString(),
    categories: rowCategories([1, 0.9, 0.79, 1, 0.7]),
  },
  {
    rank: 4,
    user: "sakib-r",
    points: 3904,
    flags: 12,
    totalFlags: 15,
    firstBloods: 1,
    lastCaptureAt: new Date(Date.now() - 7 * 60_000).toISOString(),
    categories: rowCategories([1, 0.85, 0.71, 1, 0.6]),
  },
  {
    rank: 5,
    user: "mehjabin",
    points: 3655,
    flags: 11,
    totalFlags: 15,
    firstBloods: 2,
    lastCaptureAt: new Date(Date.now() - 3 * 60_000).toISOString(),
    categories: rowCategories([1, 0.8, 0.63, 1, 0.5]),
  },
  {
    rank: 6,
    user: "arif.codes",
    points: 3410,
    flags: 11,
    totalFlags: 15,
    firstBloods: 1,
    lastCaptureAt: new Date(Date.now() - 19 * 60_000).toISOString(),
    categories: rowCategories([1, 0.75, 0.55, 1, 0.4]),
  },
  {
    rank: 7,
    user: "labrat42",
    points: 3122,
    flags: 10,
    totalFlags: 15,
    firstBloods: 0,
    lastCaptureAt: new Date(Date.now() - 24 * 60_000).toISOString(),
    categories: rowCategories([1, 0.7, 0.47, 1, 0.3]),
  },
];

const MOCK_ME: ScoreRow = {
  rank: 41,
  user: "de.bina",
  points: 1085,
  flags: 4,
  totalFlags: 15,
  firstBloods: 0,
  lastCaptureAt: new Date(Date.now() - 9 * 60_000).toISOString(),
  categories: rowCategories([0, 0.4, 0, 0.5, 0.5]),
  isYou: true,
};

export const MOCK_PROGRESSION: ProgressionSeries[] = [
  {
    user: "nadia.k",
    color: "var(--arena-medal-gold)",
    points: [
      { t: 0, score: 0 },
      { t: 27, score: 900 },
      { t: 54, score: 1700 },
      { t: 81, score: 2600 },
      { t: 108, score: 3300 },
      { t: 135, score: 4100 },
      { t: 162, score: 4820 },
    ],
  },
  {
    user: "rafi_dev",
    color: "var(--arena-medal-silver)",
    points: [
      { t: 0, score: 0 },
      { t: 36, score: 800 },
      { t: 63, score: 1500 },
      { t: 90, score: 2300 },
      { t: 117, score: 3100 },
      { t: 144, score: 3900 },
      { t: 171, score: 4412 },
    ],
  },
  {
    user: "tanvir.ml",
    color: "var(--arena-medal-bronze)",
    points: [
      { t: 0, score: 0 },
      { t: 32, score: 600 },
      { t: 58, score: 1400 },
      { t: 90, score: 2100 },
      { t: 126, score: 3000 },
      { t: 153, score: 3700 },
      { t: 180, score: 4180 },
    ],
  },
  {
    user: "sakib-r",
    color: "var(--arena-cyan)",
    points: [
      { t: 0, score: 0 },
      { t: 45, score: 700 },
      { t: 81, score: 1600 },
      { t: 108, score: 2400 },
      { t: 144, score: 3300 },
      { t: 180, score: 3904 },
    ],
  },
  {
    user: "mehjabin",
    color: "var(--arena-purple)",
    points: [
      { t: 0, score: 0 },
      { t: 36, score: 500 },
      { t: 72, score: 1300 },
      { t: 112, score: 2200 },
      { t: 148, score: 3000 },
      { t: 180, score: 3655 },
    ],
  },
  {
    user: "you",
    color: "var(--arena-lime-fg)",
    isYou: true,
    points: [
      { t: 0, score: 0 },
      { t: 14, score: 136 },
      { t: 23, score: 278 },
      { t: 50, score: 520 },
      { t: 72, score: 837 },
      { t: 83, score: 1085 },
    ],
  },
];

export const MOCK_TOP3: PodiumPlace[] = [
  { place: 1, user: "nadia.k", points: 4820, firstBloods: 4 },
  { place: 2, user: "rafi_dev", points: 4412, firstBloods: 3 },
  { place: 3, user: "tanvir.ml", points: 4180, firstBloods: 2 },
];

const MOCK_TOTAL = 214;

function slugTitle(slug: string): string {
  if (slug === "weekly-advanced-1") {
    return "Weekly CTF #1 — Advanced";
  }
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Mock page slice — page 1 shows spec rows; other pages are synthetic filler. */
export function getScoreboardPayload(
  slug: string,
  page: number,
): ScoreboardPayload {
  const safePage = Math.max(1, page);
  const pageSize = SCOREBOARD_PAGE_SIZE;

  let rows: ScoreRow[] = [];
  if (safePage === 1) {
    rows = MOCK_TABLE.map((r) => ({ ...r }));
  } else {
    const startRank = (safePage - 1) * pageSize + 1;
    rows = Array.from({ length: Math.min(7, pageSize) }, (_, i) => {
      const rank = startRank + i;
      return {
        rank,
        user: `operator_${rank}`,
        points: Math.max(200, 3000 - rank * 40),
        flags: Math.max(1, 15 - Math.floor(rank / 5)),
        totalFlags: 15,
        firstBloods: rank % 7 === 0 ? 1 : 0,
        lastCaptureAt: new Date(Date.now() - rank * 60_000).toISOString(),
        categories: rowCategories([0.8, 0.6, 0.5, 0.7, 0.4]),
      };
    });
  }

  return {
    slug,
    eventTitle: slugTitle(slug),
    operatorsTotal: MOCK_TOTAL,
    rows,
    total: MOCK_TOTAL,
    page: safePage,
    pageSize,
    me: { ...MOCK_ME },
    top3: MOCK_TOP3,
    series: MOCK_PROGRESSION,
  };
}

export function scoreboardToCsv(payload: ScoreboardPayload): string {
  const header = [
    "rank",
    "user",
    "points",
    "flags",
    "total_flags",
    "first_bloods",
    "last_capture_at",
    ...CATEGORY_IDS.map((id) => `cat_${id}`),
  ].join(",");
  const allRows = [...payload.rows];
  if (!allRows.some((r) => r.isYou) && payload.me) {
    allRows.push(payload.me);
  }
  const lines = allRows.map((r) => {
    const cats = CATEGORY_IDS.map(
      (id) => `${r.categories[id]?.solved ?? 0}/${r.categories[id]?.total ?? 0}`,
    );
    return [
      r.rank,
      r.user,
      r.points,
      r.flags,
      r.totalFlags,
      r.firstBloods,
      r.lastCaptureAt,
      ...cats,
    ].join(",");
  });
  return [header, ...lines].join("\n");
}

export function formatElapsedMinutes(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h === 0) {
    return `${min}:00`;
  }
  return `${h}:${String(min).padStart(2, "0")}`;
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.max(0, Math.floor(diff / 1000));
  if (sec < 60) {
    return `${sec}s ago`;
  }
  const min = Math.floor(sec / 60);
  if (min < 60) {
    return `${min}m ago`;
  }
  const h = Math.floor(min / 60);
  return `${h}h ago`;
}

/** Merge progression series into recharts rows (stepAfter). */
export function buildProgressionChartData(
  series: ProgressionSeries[],
  maxMinutes = 180,
): { minute: number; [key: string]: number }[] {
  const keys = series.map((s) => s.user);
  const minuteSet = new Set<number>([0, maxMinutes]);
  for (const s of series) {
    for (const p of s.points) {
      minuteSet.add(p.t);
    }
  }
  const minutes = [...minuteSet].filter((m) => m <= maxMinutes).sort((a, b) => a - b);

  const scoreAt = (s: ProgressionSeries, minute: number) => {
    let score = 0;
    for (const p of s.points) {
      if (p.t <= minute) {
        score = p.score;
      } else {
        break;
      }
    }
    return score;
  };

  return minutes.map((minute) => {
    const row: { minute: number; [key: string]: number } = { minute };
    for (const s of series) {
      row[s.user] = scoreAt(s, minute);
    }
    return row;
  });
}

export function progressionAriaSummary(series: ProgressionSeries[]): string {
  const you = series.find((s) => s.isYou);
  const top = series.find((s) => s.user === "nadia.k");
  const youScore = you?.points.at(-1)?.score ?? 0;
  const topScore = top?.points.at(-1)?.score ?? 0;
  return `Score progression over three hours. Leader near ${topScore} points. Your score ${youScore} points.`;
}
