import { simulatorLabel } from "@/config/simulators";
import type { PracticeBannerVariant, PracticeProblemCard } from "@/features/practice-hub/types";
import type { UserExerciseSolveStat } from "@/features/problems/problems-api";
import type { Exercise } from "@/types/exercise";

function difficultyLabel(d: Exercise["difficulty"]) {
  if (d === "E") {
    return "Easy";
  }
  if (d === "M") {
    return "Medium";
  }
  return "Hard";
}

function bannerVariant(exercise: Exercise): PracticeBannerVariant {
  if (exercise.simulator === "rag") {
    return "lime-dark";
  }
  if (exercise.simulator === "guardrails") {
    return "blue-bright";
  }
  if (exercise.difficulty === "H") {
    return "purple-soft";
  }
  return "navy-grid";
}

export function mapExerciseToPracticeCard(
  exercise: Exercise,
  progress?: UserExerciseSolveStat,
): PracticeProblemCard {
  return {
    slug: exercise.slug,
    title: exercise.title,
    simulator: exercise.simulator,
    simulatorLabel: simulatorLabel(exercise.simulator),
    difficulty: exercise.difficulty,
    difficultyLabel: difficultyLabel(exercise.difficulty),
    cleared: progress?.cleared ?? false,
    solveRate: progress?.solveRate,
    bannerVariant: bannerVariant(exercise),
    tags: exercise.skillTags?.slice(0, 3) ?? [],
  };
}
