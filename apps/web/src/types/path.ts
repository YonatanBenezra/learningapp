import type { SimulatorSlug } from "@/config/simulators";
import type { Difficulty } from "./exercise";

export type PathListItem = {
  slug: string;
  title: string;
  intent: string;
  stepCount: number;
  passedCount: number;
  nextSlug: string | null;
  complete: boolean;
};

export type PathStep = {
  position: number;
  slug: string;
  title: string;
  difficulty: Difficulty;
  simulator: SimulatorSlug;
  passed: boolean;
};

export type PathDetail = PathListItem & {
  steps: PathStep[];
};

export type PathListResponse = {
  items: PathListItem[];
};
