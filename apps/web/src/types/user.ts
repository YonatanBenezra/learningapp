export type UserRole = "learner" | "tutor" | "org_admin" | "admin";

export type AccountTier = "free" | "pro";

export type User = {
  id: string;
  email: string;
  role: UserRole;
  displayName?: string | null;
  profile?: {
    slug: string | null;
    public: boolean;
    canPublish: boolean;
    published: boolean;
    urlPath: string | null;
  };
  account?: {
    tier: AccountTier;
    subscriptionStatus: string;
    attemptsThisPeriod: number;
    attemptsRemaining: number;
    quotaExceeded: boolean;
    dailyRunCount: number;
    limits: {
      attemptsPerPeriod: number;
      periodKind: "calendar_week" | "rolling_30d";
    };
  };
  onboarding?: {
    needed: boolean;
    exerciseSlug: string;
    starter: Record<string, unknown>;
    createdAt: string;
    timeToFirstSubmitMs: number | null;
    timeToFirstPassMs: number | null;
  };
};
