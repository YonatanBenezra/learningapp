import { AccountTier, type Account } from '@prisma/client';

const PRO_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export function periodStartFor(tier: AccountTier, now: Date): Date {
  return tier === AccountTier.pro ? now : utcMondayStart(now);
}

export function shouldResetPeriod(account: Account, now: Date): boolean {
  if (!account.periodStartedAt) {
    return true;
  }
  if (account.tier === AccountTier.pro) {
    return now.getTime() - account.periodStartedAt.getTime() >= PRO_WINDOW_MS;
  }
  return account.periodStartedAt.getTime() < utcMondayStart(now).getTime();
}

export function utcMondayStart(now = new Date()): Date {
  const day = now.getUTCDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - daysFromMonday,
    ),
  );
}

export function utcDateOnly(now = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export function rollingWindowStart(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export function sameUtcDay(left: Date, right: Date): boolean {
  return utcDateOnly(left).getTime() === utcDateOnly(right).getTime();
}
