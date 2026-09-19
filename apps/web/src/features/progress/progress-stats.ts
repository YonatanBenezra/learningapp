import { SIMULATOR_LABELS, type SimulatorSlug } from "@/config/simulators";
import type { Exercise } from "@/types/exercise";
import type { ProgressItem, SkillScore } from "@/types/progress";

export type LanguageUsage = {
  slug: SimulatorSlug;
  label: string;
  count: number;
};

export type DifficultyBreakdown = {
  easy: { solved: number; total: number };
  medium: { solved: number; total: number };
  hard: { solved: number; total: number };
};

export type HeatmapDay = {
  date: string;
  count: number;
};

export function passedSlugs(items: ProgressItem[]): Set<string> {
  const slugs = new Set<string>();
  for (const item of items) {
    if (item.verdict?.toLowerCase() === "pass") {
      slugs.add(item.exerciseSlug);
    }
  }
  return slugs;
}

export function difficultyBreakdown(
  problems: Exercise[],
  solved: Set<string>,
): DifficultyBreakdown {
  const tally = {
    easy: { solved: 0, total: 0 },
    medium: { solved: 0, total: 0 },
    hard: { solved: 0, total: 0 },
  };

  for (const problem of problems) {
    const bucket =
      problem.difficulty === "E"
        ? tally.easy
        : problem.difficulty === "M"
          ? tally.medium
          : tally.hard;
    bucket.total += 1;
    if (solved.has(problem.slug)) {
      bucket.solved += 1;
    }
  }

  return tally;
}

export function attemptingCount(items: ProgressItem[], solved: Set<string>) {
  const seen = new Set<string>();
  for (const item of items) {
    seen.add(item.exerciseSlug);
  }
  let count = 0;
  for (const slug of seen) {
    if (!solved.has(slug)) {
      count += 1;
    }
  }
  return count;
}

export function buildHeatmap(items: ProgressItem[], days = 365): HeatmapDay[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (!item.startedAt) {
      continue;
    }
    const key = item.startedAt.slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const result: HeatmapDay[] = [];
  const today = new Date();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    result.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return result;
}

export function activeDays(heatmap: HeatmapDay[]) {
  return heatmap.filter((day) => day.count > 0).length;
}

export function maxStreakFromHeatmap(heatmap: HeatmapDay[]) {
  let best = 0;
  let current = 0;
  for (const day of heatmap) {
    if (day.count > 0) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

export function groupSkills(skills: SkillScore[]) {
  const advanced: SkillScore[] = [];
  const intermediate: SkillScore[] = [];
  const fundamental: SkillScore[] = [];

  for (const skill of skills) {
    if (skill.score >= 0.7) {
      advanced.push(skill);
    } else if (skill.score >= 0.4) {
      intermediate.push(skill);
    } else {
      fundamental.push(skill);
    }
  }

  return { advanced, intermediate, fundamental };
}

export function totalSubmissions(heatmap: HeatmapDay[]) {
  return heatmap.reduce((sum, day) => sum + day.count, 0);
}

export function languageUsage(
  items: ProgressItem[],
  problems: Exercise[],
): LanguageUsage[] {
  const bySlug = new Map(problems.map((problem) => [problem.slug, problem.simulator]));
  const counts = new Map<SimulatorSlug, number>();

  for (const item of items) {
    const simulator = bySlug.get(item.exerciseSlug);
    if (!simulator) {
      continue;
    }
    counts.set(simulator, (counts.get(simulator) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([slug, count]) => ({
      slug,
      label: SIMULATOR_LABELS[slug],
      count,
    }));
}
