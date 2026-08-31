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

export type Streak = {
  current: number;
  longest: number;
  timezone: string;
  today: string;
  lastQualifiedDate: string | null;
};

export type DailyDrill = {
  date: string;
  slug: string;
  title: string;
  difficulty: string;
  simulator: string;
  completed: boolean;
};

export type Progress = {
  attempts: number;
  solves: number;
  items: ProgressItem[];
  skills: SkillScore[];
  streak: Streak;
  dailyDrill: DailyDrill | null;
};
