export type PracticeTab = "all" | "rag" | "guardrails" | "solved" | "todo";

export type PracticeBannerVariant = "navy-grid" | "lime-dark" | "blue-bright" | "purple-soft";

export type PracticeProblemCard = {
  slug: string;
  title: string;
  simulator: string;
  simulatorLabel: string;
  difficulty: "E" | "M" | "H";
  difficultyLabel: string;
  cleared: boolean;
  solveRate?: number;
  bannerVariant: PracticeBannerVariant;
  tags: string[];
};
