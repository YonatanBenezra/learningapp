export type UserRole = "learner" | "tutor" | "org_admin" | "admin";

export type AccountTier = "free" | "pro";

export type User = {
  id: string;
  email: string;
  role: UserRole;
  displayName?: string;
  account?: {
    tier: AccountTier;
    subscriptionStatus: string;
    attemptsThisPeriod: number;
    dailyRunCount: number;
  };
};
