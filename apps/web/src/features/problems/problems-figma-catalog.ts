import { routes } from "@/config/routes";

export type ProblemTrack = "rag" | "guard" | "agent" | "eval" | "prompt";
export type ProblemDifficulty = "easy" | "medium" | "hard";
export type ProblemMode = "engineering" | "red" | "blue";
export type ProblemStatus = "solved" | "in_progress" | "not_started";
export type ProblemAction = "review" | "start" | "continue";

export type CatalogProblem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  track: ProblemTrack;
  difficulty: ProblemDifficulty;
  mode: ProblemMode;
  solveRate: number;
  status: ProblemStatus;
  action: ProblemAction;
  current?: boolean;
  actionPrimary?: boolean;
};

export function hrefForProblem(slug: string) {
  return routes.exercise(slug);
}
