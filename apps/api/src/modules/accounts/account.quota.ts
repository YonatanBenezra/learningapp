import { HttpException, HttpStatus } from '@nestjs/common';
import { AccountTier, type Account } from '@prisma/client';
import { pricing } from '../../config/pricing.constants';
import { shouldResetPeriod } from './account.periods';

export const HINT_UPGRADE_MESSAGE =
  'Further hints are temporarily unavailable. Try again later.';

export const GATED_TRACE_MESSAGE =
  'Full trace details are temporarily unavailable for this run.';

export function limitsFor(_tier: AccountTier) {
  return {
    attemptsPerPeriod: pricing.proFairUseAttemptsMonthly,
    periodKind: 'rolling_30d' as const,
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

export function quotaExceededMessage(_tier: AccountTier): string {
  return `You've reached the fair-use cap of ${pricing.proFairUseAttemptsMonthly} graded attempts this month. Your window resets after the first attempt in a new period.`;
}

export class QuotaExceededException extends HttpException {
  constructor(tier: AccountTier) {
    super(
      {
        message: quotaExceededMessage(tier),
        code: 'quota_exceeded',
        attemptsRemaining: 0,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
