import type { SimulatorSlug } from "@/config/simulators";

export type Difficulty = "E" | "M" | "H";

export type PublicSampleItem = {
  id?: string;
  question: string;
  goldAnswer?: string | null;
  answerable?: boolean;
};

export type Exercise = {
  slug: string;
  version: number;
  title: string;
  simulator: SimulatorSlug;
  difficulty: Difficulty;
  skillTags: string[];
  briefMd?: string;
  submissionSchema?: unknown;
  budget?: unknown;
  publicSample?: PublicSampleItem[] | unknown;
};

export type ExerciseListResponse = {
  items: Exercise[];
  page: number;
  pageSize: number;
  total: number;
};
