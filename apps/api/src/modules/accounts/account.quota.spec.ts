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

  it('gives Free 3 attempts per UTC week and Pro 60 per rolling 30 days', () => {
    expect(limitsFor(AccountTier.free)).toEqual({
      attemptsPerPeriod: 3,
      periodKind: 'calendar_week',
    });
    expect(limitsFor(AccountTier.pro)).toEqual({
      attemptsPerPeriod: 60,
      periodKind: 'rolling_30d',
    });
  });

  it('resets Free usage after UTC Monday', () => {
    const lastWeek = account({
      attemptsThisPeriod: 3,
      periodStartedAt: new Date('2026-08-24T00:00:00Z'),
    });
    expect(effectiveAttemptsThisPeriod(lastWeek, wednesday)).toBe(0);
    expect(remainingAttempts(lastWeek, wednesday)).toBe(3);
  });

  it('blocks Free at 3 and Pro at 60 in the current window', () => {
    const free = account({ attemptsThisPeriod: 3 });
    expect(remainingAttempts(free, wednesday)).toBe(0);
    expect(quotaExceededMessage(AccountTier.free)).toMatch(/3 free/);
    expect(quotaExceededMessage(AccountTier.free)).toMatch(/Upgrade to Pro/);

    const pro = account({
      tier: AccountTier.pro,
      attemptsThisPeriod: 60,
      periodStartedAt: new Date('2026-08-20T00:00:00Z'),
    });
    expect(remainingAttempts(pro, wednesday)).toBe(0);
    expect(quotaExceededMessage(AccountTier.pro)).toMatch(/60 graded/);
  });
});
