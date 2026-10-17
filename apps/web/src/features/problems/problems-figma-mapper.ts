import type { Difficulty, Exercise } from "@/types/exercise";
import type { UserExerciseSolveStat } from "@/features/problems/problems-api";
import type {
  CatalogProblem,
  ProblemAction,
  ProblemDifficulty,
  ProblemMode,
  ProblemStatus,
  ProblemTrack,
} from "./problems-figma-catalog";

export function trackFromSimulator(simulator: string): ProblemTrack {
  if (simulator === "guardrails") {
    return "guard";
  }
  if (simulator === "agent") {
    return "agent";
  }
  return "rag";
}

function difficultyFromApi(d: Difficulty): ProblemDifficulty {
  if (d === "E") {
    return "easy";
  }
  if (d === "H") {
    return "hard";
  }
  return "medium";
}

function problemId(slug: string): string {
  const parts = slug.split("-");
  if (parts.length >= 2) {
    return `${parts[0]?.toUpperCase()}-${parts[1]?.toUpperCase()}`;
  }
  return slug.slice(0, 12).toUpperCase();
}

function modeForExercise(exercise: Exercise): ProblemMode {
  if (exercise.simulator === "guardrails") {
    const tags = exercise.skillTags.join(" ").toLowerCase();
    if (tags.includes("attack") || tags.includes("injection") || tags.includes("jailbreak")) {
      return "red";
    }
    return "blue";
  }
  return "engineering";
}

function statusForStat(stat: UserExerciseSolveStat | undefined): ProblemStatus {
  if (!stat || stat.gradedAttempts === 0) {
    return "not_started";
  }
  if (stat.cleared) {
    return "solved";
  }
  return "in_progress";
}

function actionForStatus(status: ProblemStatus): ProblemAction {
  if (status === "solved") {
    return "review";
  }
  if (status === "in_progress") {
    return "continue";
  }
  return "start";
}

export function exerciseToCatalogProblem(
  exercise: Exercise,
  stat?: UserExerciseSolveStat,
): CatalogProblem {
  const status = statusForStat(stat);
  return {
    id: problemId(exercise.slug),
    slug: exercise.slug,
    title: exercise.title,
    description: briefLead(exercise.briefMd) ?? exercise.title,
    tags: [trackFromSimulator(exercise.simulator), "graded", ...exercise.skillTags.slice(0, 2)],
    track: trackFromSimulator(exercise.simulator),
    difficulty: difficultyFromApi(exercise.difficulty),
    mode: modeForExercise(exercise),
    solveRate: stat?.solveRate ?? 0,
    status,
    action: actionForStatus(status),
    actionPrimary: status === "in_progress",
  };
}

function briefLead(briefMd?: string): string | undefined {
  if (!briefMd) {
    return undefined;
  }
  const line = briefMd
    .split("\n")
    .map((row) => row.trim())
    .find((row) => row && !row.startsWith("#"));
  return line?.replace(/^[-*]\s*/, "").slice(0, 160);
}

export function sortCatalogRecommended(a: CatalogProblem, b: CatalogProblem): number {
  const trackOrder: Record<ProblemTrack, number> = { rag: 0, guard: 1, agent: 2, eval: 3, prompt: 4 };
  const diffOrder: Record<ProblemDifficulty, number> = { easy: 0, medium: 1, hard: 2 };
  const ta = trackOrder[a.track] ?? 9;
  const tb = trackOrder[b.track] ?? 9;
  if (ta !== tb) {
    return ta - tb;
  }
  const da = diffOrder[a.difficulty];
  const db = diffOrder[b.difficulty];
  if (da !== db) {
    return da - db;
  }
  return a.title.localeCompare(b.title);
}
