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
};
