import { Injectable } from '@nestjs/common';
import { AccountTier, Prisma, type Account } from '@prisma/client';
import { pricing } from '../../config/pricing.constants';
import { PrismaService } from '../../core/prisma/prisma.service';
import { sameUtcDay, utcDateOnly, utcMondayStart } from './account.periods';
import type { AccountReadout, AccountUsage } from './account.types';

type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureAccount(
    userId: string,
    db: DbClient = this.prisma,
  ): Promise<Account> {
    return db.account.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async incrementOnSubmission(
    userId: string,
    now = new Date(),
    db: DbClient = this.prisma,
  ): Promise<Account> {
    const account = await this.ensureAccount(userId, db);
    const resetPeriod = shouldResetPeriod(account, now);
    const resetDaily =
      !account.dailyRunDate || !sameUtcDay(account.dailyRunDate, now);
    return db.account.update({
      where: { userId },
      data: {
        periodStartedAt: resetPeriod
          ? periodStartFor(account.tier, now)
          : (account.periodStartedAt ?? periodStartFor(account.tier, now)),
        attemptsThisPeriod: resetPeriod ? 1 : { increment: 1 },
        dailyRunDate: utcDateOnly(now),
        dailyRunCount: resetDaily ? 1 : { increment: 1 },
        lastAttemptAt: now,
      },
    });
  }

  async usageFor(userId: string): Promise<AccountUsage> {
    const account = await this.ensureAccount(userId);
    return toUsage(account);
  }

  async readoutFor(userId: string): Promise<AccountReadout | null> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { account: true },
    });
    if (!user) {
      return null;
    }
    const account = user.account ?? (await this.ensureAccount(user.id));
    return {
      userId: user.id,
      email: user.email,
      ...toUsage(account),
    };
  }

  async listReadouts(take = 50): Promise<AccountReadout[]> {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      include: { account: true },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(take, 1), 200),
    });
    const rows: AccountReadout[] = [];
    for (const user of users) {
      const account = user.account ?? (await this.ensureAccount(user.id));
      rows.push({
        userId: user.id,
        email: user.email,
        ...toUsage(account),
      });
    }
    return rows;
  }
}

const PRO_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function periodStartFor(tier: AccountTier, now: Date): Date {
  return tier === AccountTier.pro ? now : utcMondayStart(now);
}

function shouldResetPeriod(account: Account, now: Date): boolean {
  if (!account.periodStartedAt) {
    return true;
  }
  if (account.tier === AccountTier.pro) {
    return now.getTime() - account.periodStartedAt.getTime() >= PRO_WINDOW_MS;
  }
  return account.periodStartedAt.getTime() < utcMondayStart(now).getTime();
}

function toUsage(account: Account): AccountUsage {
  const pro = account.tier === AccountTier.pro;
  return {
    tier: account.tier,
    subscriptionStatus: account.subscriptionStatus,
    attemptsThisPeriod: account.attemptsThisPeriod,
    periodStartedAt: account.periodStartedAt?.toISOString() ?? null,
    dailyRunCount: account.dailyRunCount,
    dailyRunDate: account.dailyRunDate
      ? utcDateOnly(account.dailyRunDate).toISOString()
      : null,
    lastAttemptAt: account.lastAttemptAt?.toISOString() ?? null,
    limits: {
      attemptsPerPeriod: pro
        ? pricing.proFairUseAttemptsMonthly
        : pricing.freeExercisesPerWeek,
      periodKind: pro ? 'rolling_30d' : 'calendar_week',
    },
  };
}
