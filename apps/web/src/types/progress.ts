export type ProgressItem = {
  attemptId: string;
  exerciseSlug: string;
  title: string;
  status: string;
  startedAt: string;
  runId: string | null;
  verdict: string | null;
};

export type SkillScore = {
  slug: string;
  name: string;
  score: number;
};

export type Progress = {
  attempts: number;
  solves: number;
  items: ProgressItem[];
  skills: SkillScore[];
};
