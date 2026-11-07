import type { ScoreboardEntry, ScoreTimePoint } from "./types";

const COUNTRIES = [
  "US",
  "BD",
  "DE",
  "GB",
  "IN",
  "JP",
  "FR",
  "CA",
  "BR",
  "NL",
  "WO",
  "SG",
  "AU",
  "SE",
  "KR",
] as const;

const OPERATOR_NAMES = [
  "nadia.k",
  "rafi_dev",
  "tanvir.ml",
  "sakib-r",
  "mehjabin",
  "jewel.mia",
  "aria.zero",
  "omar.ctf",
  "lena.ops",
  "kai.prompt",
  "ivy.embed",
  "noah.rag",
  "zara.guard",
  "eli.eval",
  "mira.exfil",
  "dev.null",
  "hex_7",
  "byte_witch",
  "stacktrace",
  "flag_hunter",
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h + s.charCodeAt(i) * (i + 1)) % 9973;
  }
  return h;
}

function countryFor(name: string, rank: number): string {
  if (rank % 17 === 0) {
    return "WO";
  }
  return COUNTRIES[hashString(name) % COUNTRIES.length] ?? "US";
}

function buildSeries(name: string, finalPoints: number, total: number): ScoreTimePoint[] {
  const h = hashString(name);
  const start = Date.UTC(2025, 9, 1, 8, 0, 0);
  const solves = Math.min(total, Math.max(3, Math.floor(finalPoints / 900) + (h % 5)));
  const points: ScoreTimePoint[] = [{ time: start, points: 0, label: "OCT 1\n12:00 PM" }];
  let acc = 0;
  for (let i = 0; i < solves; i++) {
    const increment = Math.round((finalPoints - acc) / (solves - i) + (h % 400) - 200);
    acc += Math.max(200, increment);
    if (acc > finalPoints) {
      acc = finalPoints;
    }
    const t = start + (i + 1) * (45 + (h % 37)) * 60_000;
    const hr = new Date(t);
    const label =
      i === 0
        ? "OCT 1\n12:00 PM"
        : `${hr.toLocaleString("en-US", { month: "short", day: "numeric" }).toUpperCase()}\n${hr.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
    points.push({ time: t, points: acc, label });
  }
  if (points.at(-1)!.points !== finalPoints) {
    const t = points.at(-1)!.time + 30 * 60_000;
    points.push({ time: t, points: finalPoints, label: points.at(-1)!.label });
  }
  return points;
}

/** Mock solo operators for chart/podium padding when the board is sparse. */
export function generateMockOperators(count = 100, youIndex = 42): ScoreboardEntry[] {
  const entries: ScoreboardEntry[] = [];
  for (let rank = 1; rank <= count; rank++) {
    const baseName = OPERATOR_NAMES[(rank - 1) % OPERATOR_NAMES.length]!;
    const name =
      rank <= OPERATOR_NAMES.length ? baseName : `${baseName}_${Math.floor(rank / OPERATOR_NAMES.length)}`;
    const total = 37;
    const solved = Math.max(0, total - Math.floor(rank / 3) - (hashString(name) % 4));
    const points =
      rank === 1 ? 34800 : Math.max(1200, 34800 - rank * 280 - (hashString(name) % 900));
    const isYou = rank === youIndex;
    const country =
      rank === 1 ? "TR" : rank === 2 ? "ID" : rank === 3 ? "JO" : countryFor(name, rank);
    entries.push({
      id: `mock-${rank}`,
      rank,
      name: isYou ? "You" : name,
      country,
      points,
      solved,
      total,
      isYou,
      elapsedMs: 120_000 + rank * 90_000,
      series: buildSeries(name, points, total),
    });
  }
  return entries;
}

export function attachSeries(entry: Omit<ScoreboardEntry, "series">): ScoreboardEntry {
  return {
    ...entry,
    series: buildSeries(entry.name, entry.points, entry.total),
  };
}

/** Full leaderboard: mock ranks 1…N with API rows overriding matching rank. */
export function mergeApiWithMock(
  apiRows: Omit<ScoreboardEntry, "series">[],
  mockFallback: ScoreboardEntry[],
): ScoreboardEntry[] {
  const byRank = new Map(mockFallback.map((m) => [m.rank, m]));
  for (const api of apiRows) {
    const series = buildSeries(api.name, api.points, api.total);
    byRank.set(api.rank, { ...api, series });
  }
  return [...byRank.values()].sort((a, b) => a.rank - b.rank);
}

/** Chart / podium: always `n` slots; real operators replace mock at the same rank. */
export function pickVisualTop(
  apiRows: ScoreboardEntry[],
  mockFallback: ScoreboardEntry[],
  n: number,
): ScoreboardEntry[] {
  const slots = mockFallback.slice(0, n).map((m) => ({ ...m }));
  for (const api of apiRows) {
    if (api.rank >= 1 && api.rank <= n) {
      slots[api.rank - 1] = api;
    }
  }
  return slots;
}

/** @deprecated Use {@link generateMockOperators} */
export const generateMockTeams = generateMockOperators;
