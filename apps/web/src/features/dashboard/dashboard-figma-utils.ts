import type { Exercise } from "@/types/exercise";
import type { ProgressItem, SkillScore } from "@/types/progress";
import type { User } from "@/types/user";

export type DashboardTrackKey = "rag" | "eval" | "guard" | "prompt";

export const DASHBOARD_TRACK_ORDER: DashboardTrackKey[] = ["guard", "rag", "eval", "prompt"];

export const DASHBOARD_TRACK_LABEL: Record<DashboardTrackKey, string> = {
  guard: "Guard",
  rag: "RAG",
  eval: "Eval",
  prompt: "Prompt",
};

export function simulatorToDashboardTrack(simulator: string): DashboardTrackKey | null {
  switch (simulator) {
    case "rag":
      return "rag";
    case "evaluation":
      return "eval";
    case "guardrails":
      return "guard";
    case "prompt_engineering":
      return "prompt";
    default:
      return null;
  }
}

export function greetingForHour(hour: number): string {
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 18) {
    return "Good afternoon";
  }
  return "Good evening";
}

export function dashboardEyebrowDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
    .format(now)
    .toUpperCase();
}

export function formatJoinMonth(user: User): string | null {
  const created = user.onboarding?.createdAt;
  if (!created) {
    return null;
  }
  const date = new Date(created);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(date);
}

export function userInitials(user: User): string {
  const name = user.displayName?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return user.email.slice(0, 2).toUpperCase();
}

export function displayName(user: User): string {
  return user.displayName?.trim() || user.email.split("@")[0] || "Learner";
}

export function trackPassCounts(
  items: ProgressItem[],
  problems: Exercise[],
): Record<DashboardTrackKey, number> {
  const bySlug = new Map(problems.map((p) => [p.slug, p.simulator]));
  const unique: Record<DashboardTrackKey, Set<string>> = {
    rag: new Set(),
    eval: new Set(),
    guard: new Set(),
    prompt: new Set(),
  };
  for (const item of items) {
    if (item.verdict?.toLowerCase() !== "pass") {
      continue;
    }
    const sim = bySlug.get(item.exerciseSlug);
    if (!sim) {
      continue;
    }
    const track = simulatorToDashboardTrack(sim);
    if (track) {
      unique[track].add(item.exerciseSlug);
    }
  }
  return {
    rag: unique.rag.size,
    eval: unique.eval.size,
    guard: unique.guard.size,
    prompt: unique.prompt.size,
  };
}

export function attemptCountsBySlug(items: ProgressItem[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(item.exerciseSlug, (map.get(item.exerciseSlug) ?? 0) + 1);
  }
  return map;
}

export type RecentRow = {
  slug: string;
  title: string;
  track: DashboardTrackKey | null;
  trackLabel: string;
  tries: number;
  difficulty: "E" | "M" | "H";
  passedAt: string;
};

export function recentPasses(
  items: ProgressItem[],
  problems: Exercise[],
  limit = 8,
): RecentRow[] {
  const bySlug = new Map(problems.map((p) => [p.slug, p]));
  const seen = new Set<string>();
  const tries = attemptCountsBySlug(items);
  const rows: RecentRow[] = [];

  for (const item of items) {
    if (item.verdict?.toLowerCase() !== "pass") {
      continue;
    }
    if (seen.has(item.exerciseSlug)) {
      continue;
    }
    seen.add(item.exerciseSlug);
    const ex = bySlug.get(item.exerciseSlug);
    const track = ex ? simulatorToDashboardTrack(ex.simulator) : null;
    rows.push({
      slug: item.exerciseSlug,
      title: item.title,
      track,
      trackLabel: track ? DASHBOARD_TRACK_LABEL[track] : "Practice",
      tries: tries.get(item.exerciseSlug) ?? 1,
      difficulty: ex?.difficulty ?? "M",
      passedAt: item.startedAt,
    });
    if (rows.length >= limit) {
      break;
    }
  }
  return rows;
}

export function allSubmissionRows(
  items: ProgressItem[],
  problems: Exercise[],
  limit = 12,
): RecentRow[] {
  const bySlug = new Map(problems.map((p) => [p.slug, p]));
  const tries = attemptCountsBySlug(items);
  return items.slice(0, limit).map((item) => {
    const ex = bySlug.get(item.exerciseSlug);
    const track = ex ? simulatorToDashboardTrack(ex.simulator) : null;
    return {
      slug: item.exerciseSlug,
      title: item.title,
      track,
      trackLabel: track ? DASHBOARD_TRACK_LABEL[track] : "Practice",
      tries: tries.get(item.exerciseSlug) ?? 1,
      difficulty: ex?.difficulty ?? "M",
      passedAt: item.startedAt,
    };
  });
}

export function groupSkillsForDashboard(skills: SkillScore[]) {
  const advanced: SkillScore[] = [];
  const fundamental: SkillScore[] = [];
  for (const skill of skills) {
    if (skill.score >= 0.55) {
      advanced.push(skill);
    } else {
      fundamental.push(skill);
    }
  }
  return { advanced, fundamental };
}

export function continueExerciseSlug(
  items: ProgressItem[],
  solved: Set<string>,
): string | null {
  for (const item of items) {
    if (!solved.has(item.exerciseSlug)) {
      return item.exerciseSlug;
    }
  }
  return items[0]?.exerciseSlug ?? null;
}

export function continueLabelFromSlug(slug: string): string {
  const match = /-(\d{2,3})-/.exec(slug) ?? /^[a-z]+-(\d+)/i.exec(slug);
  if (match?.[1]) {
    const prefix = slug.startsWith("rag") ? "P1" : slug.startsWith("grd") ? "G" : "P";
    return `${prefix}-R${match[1].replace(/^0+/, "") || match[1]}`;
  }
  return "practice";
}

export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export type HeatmapCell = {
  date: string;
  count: number;
  weekIndex: number;
  dayIndex: number;
  isFuture: boolean;
};

export function buildHeatmapGrid(days = 371): {
  cells: HeatmapCell[];
  weekCount: number;
  monthLabels: { label: string; weekIndex: number }[];
  rangeLabel: string;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = today;
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);

  const monthLabels: { label: string; weekIndex: number }[] = [];
  let lastMonth = "";

  const cells: HeatmapCell[] = [];
  const cursor = new Date(start);
  let weekIndex = 0;
  let dayIndex = 0;

  while (cursor <= end) {
    const dateKey = cursor.toISOString().slice(0, 10);
    const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(cursor);
    if (month !== lastMonth) {
      monthLabels.push({ label: month, weekIndex });
      lastMonth = month;
    }
    cells.push({
      date: dateKey,
      count: 0,
      weekIndex,
      dayIndex,
      isFuture: cursor > end,
    });
    dayIndex += 1;
    if (dayIndex >= 7) {
      dayIndex = 0;
      weekIndex += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  const rangeLabel = `${new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(start)} – ${new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(end)}`;

  return { cells, weekCount: weekIndex + (dayIndex > 0 ? 1 : 0), monthLabels, rangeLabel };
}

export function applyHeatmapCounts(
  cells: HeatmapCell[],
  items: ProgressItem[],
): HeatmapCell[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (!item.startedAt) {
      continue;
    }
    const key = item.startedAt.slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return cells.map((cell) => ({
    ...cell,
    count: counts.get(cell.date) ?? 0,
  }));
}

export function utcMidnightResetLabel(now = new Date()): string {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const ms = next.getTime() - now.getTime();
  const hours = Math.floor(ms / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  return `resets in ${hours}h ${mins}m`;
}
