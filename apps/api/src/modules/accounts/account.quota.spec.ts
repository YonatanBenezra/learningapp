import { AccountTier, SubscriptionStatus } from '@prisma/client';
import type { Account } from '@prisma/client';
import {
  effectiveAttemptsThisPeriod,
  limitsFor,
  quotaExceededMessage,
  remainingAttempts,
} from './account.quota';

function account(partial: Partial<Account>): Account {
  return {
    userId: 'user_1',
    tier: AccountTier.free,
    subscriptionStatus: SubscriptionStatus.none,
    attemptsThisPeriod: 0,
    periodStartedAt: new Date('2026-08-31T00:00:00Z'),
    dailyRunCount: 0,
    dailyRunDate: null,
    lastAttemptAt: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  };
}

describe('account quota', () => {
  const wednesday = new Date('2026-09-02T12:00:00Z');

  it('uses the same rolling monthly fair-use cap for every tier', () => {
    const expected = {
      attemptsPerPeriod: 60,
      periodKind: 'rolling_30d' as const,
    };
    expect(limitsFor(AccountTier.free)).toEqual(expected);
    expect(limitsFor(AccountTier.pro)).toEqual(expected);
  });

  it('resets usage after the rolling window', () => {
    const stale = account({
      attemptsThisPeriod: 60,
      periodStartedAt: new Date('2026-08-01T00:00:00Z'),
    });
    expect(effectiveAttemptsThisPeriod(stale, wednesday)).toBe(0);
    expect(remainingAttempts(stale, wednesday)).toBe(60);
  });

  it('blocks at the fair-use cap in the current window', () => {
    const capped = account({ attemptsThisPeriod: 60 });
    expect(remainingAttempts(capped, wednesday)).toBe(0);
    expect(quotaExceededMessage(AccountTier.free)).toMatch(/60 graded/);
    expect(quotaExceededMessage(AccountTier.free)).not.toMatch(/Upgrade to Pro/);
  });
});
