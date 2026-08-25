import type { SimulatorSlug } from "@/config/simulators";

export type Difficulty = "E" | "M" | "H";

export type Exercise = {
  slug: string;
  title: string;
  simulator: SimulatorSlug;
  difficulty: Difficulty;
  skillTags: string[];
};
