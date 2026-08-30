import type { AccountTier, SubscriptionStatus } from '@prisma/client';

export type AccountUsage = {
  tier: AccountTier;
  subscriptionStatus: SubscriptionStatus;
  attemptsThisPeriod: number;
  attemptsRemaining: number;
  quotaExceeded: boolean;
  periodStartedAt: string | null;
  dailyRunCount: number;
  dailyRunDate: string | null;
  lastAttemptAt: string | null;
  limits: {
    attemptsPerPeriod: number;
    periodKind: 'calendar_week' | 'rolling_30d';
  };
};

export type AccountReadout = AccountUsage & {
  userId: string;
  email: string;
};
