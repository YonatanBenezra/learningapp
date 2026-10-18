export type ContestWindow = "upcoming" | "open" | "closed";

export type ContestListItem = {
  slug: string;
  title: string;
  intent: string;
  kind?: "contest" | "assessment";
  seasonKey?: string | null;
  startsAt: string;
  endsAt: string;
  timeBoxMinutes: number;
  problemCount: number;
  window: ContestWindow;
  entered: boolean;
  canEnter: boolean;
  startedAt: string | null;
  windowDeadlineAt: string | null;
  personalDeadlineAt: string | null;
  samplingMode: "fixed_pool" | "per_user";
  pointsPerProblem: number;
  maxScore: number;
};

export type ContestScoring = {
  pointsPerProblem: number;
  maxScore: number;
  entryTotalScore?: number;
};

export type ContestVirtualDetail = {
  slug: string;
  title: string;
  mode: "virtual";
  sampleSeed: string;
  sampledCount: number;
  pointsPerProblem: number;
  maxScore: number;
  problems: ContestProblem[];
};

export type ContestSittingClock = {
  window: ContestWindow;
  startedAt: string | null;
  windowDeadlineAt: string | null;
  personalDeadlineAt: string | null;
  entryStatus: "active" | "finished" | "expired";
};

export type ContestProblem = {
  slug: string;
  title: string;
  difficulty: string;
  simulator: string;
  scored: boolean;
  score: number | null;
  verdict: string | null;
};

export type ContestDetail = ContestListItem & {
  virtualPracticeAvailable: boolean;
  sampleSeed: string | null;
  sampledCount: number;
  totalScore: number | null;
  elapsedMs: number | null;
  status: "active" | "finished" | "expired" | null;
  problems: ContestProblem[];
  scorecard: {
    totalScore: number;
    maxScore: number;
    elapsedMs: number;
    items: { slug: string; score: number; verdict: string }[];
    result: {
      band: string;
      bandLabel: string;
      totalScore: number;
      maxScore: number;
      elapsedMs: number;
      timeBoxMinutes: number;
      seasonKey: string | null;
      sampleCount: number;
      sampleSeed: string;
      window: { startsAt: string; endsAt: string };
      items: {
        slug: string;
        title: string;
        verdict: string;
        score: number;
      }[];
      skills: {
        slug: string;
        name: string;
        score: number;
        problems: number;
      }[];
    } | null;
    signed: {
      id: string;
      keyId: string;
      issuedAt: string;
      revokedAt: string | null;
      revokeReasonCode: string | null;
      signatureValid: boolean;
    } | null;
  } | null;
};

export type ContestListResponse = {
  items: ContestListItem[];
};

export type ContestLeaderboardItem = {
  rank: number;
  displayName: string;
  profileSlug: string | null;
  totalScore: number;
  elapsedMs: number | null;
  solvedCount: number;
  totalCount: number;
  status: "active" | "finished" | "expired";
  isYou: boolean;
};

export type ContestLeaderboard = {
  contest: {
    slug: string;
    title: string;
    window: ContestWindow;
    pointsPerProblem: number;
    maxScore: number;
  };
  page: number;
  pageSize: number;
  total: number;
  items: ContestLeaderboardItem[];
};

export type ContestExercise = {
  slug: string;
  version: number;
  type: string;
  simulator: string;
  title: string;
  briefMd: string;
  difficulty: string;
  submissionSchema: Record<string, unknown>;
  publicSample: unknown;
  contestSlug: string;
  hintsDisabled: boolean;
  mode?: "virtual";
  clock?: ContestSittingClock;
  scoring?: ContestScoring;
};
