import { HttpException, HttpStatus } from '@nestjs/common';
import { AccountTier, type Account } from '@prisma/client';
import { pricing } from '../../config/pricing.constants';
import { shouldResetPeriod } from './account.periods';

export const HINT_UPGRADE_MESSAGE =
  'The first hint is free. Further hints are included with Pro.';

export const GATED_TRACE_MESSAGE =
  'Full traces are included with Pro. Your scorecard still shows the verdict.';

export function limitsFor(tier: AccountTier) {
  const pro = tier === AccountTier.pro;
  return {
    attemptsPerPeriod: pro
      ? pricing.proFairUseAttemptsMonthly
      : pricing.freeExercisesPerWeek,
    periodKind: pro ? ('rolling_30d' as const) : ('calendar_week' as const),
  };
}

export function effectiveAttemptsThisPeriod(
  account: Account,
  now = new Date(),
): number {
  return shouldResetPeriod(account, now) ? 0 : account.attemptsThisPeriod;
}

export function remainingAttempts(account: Account, now = new Date()): number {
  return Math.max(
    0,
    limitsFor(account.tier).attemptsPerPeriod -
      effectiveAttemptsThisPeriod(account, now),
  );
}

export function quotaExceededMessage(tier: AccountTier): string {
  if (tier === AccountTier.pro) {
    return `You've reached the Pro fair-use cap of ${pricing.proFairUseAttemptsMonthly} graded attempts this month. Your 30-day window resets after the first attempt in this period.`;
  }
  return `You've used your ${pricing.freeExercisesPerWeek} free graded exercises this week. Upgrade to Pro for ${pricing.proFairUseAttemptsMonthly} attempts per month.`;
}

export class QuotaExceededException extends HttpException {
  constructor(tier: AccountTier) {
    super(
      {
        message: quotaExceededMessage(tier),
        code: 'quota_exceeded',
        upgradePath: '/billing',
        attemptsRemaining: 0,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
