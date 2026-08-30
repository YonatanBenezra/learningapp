import { Injectable } from '@nestjs/common';
import {
  AccountTier,
  Prisma,
  SubscriptionStatus,
  type Account,
} from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  periodStartFor,
  sameUtcDay,
  shouldResetPeriod,
  utcDateOnly,
} from './account.periods';
import {
  effectiveAttemptsThisPeriod,
  limitsFor,
  QuotaExceededException,
  remainingAttempts,
} from './account.quota';
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
    if (remainingAttempts(account, now) <= 0) {
      throw new QuotaExceededException(account.tier);
    }
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

  async applyStripeSubscription(input: {
    userId?: string | null;
    customerId?: string | null;
    subscriptionId?: string | null;
    stripeStatus: string;
  }): Promise<Account | null> {
    const mapped = mapStripeStatus(input.stripeStatus);
    const account = await this.findForStripe(input);
    if (!account) {
      return null;
    }
    const tierChanged = account.tier !== mapped.tier;
    const now = new Date();
    return this.prisma.account.update({
      where: { userId: account.userId },
      data: {
        tier: mapped.tier,
        subscriptionStatus: mapped.subscriptionStatus,
        stripeCustomerId: input.customerId ?? account.stripeCustomerId,
        stripeSubscriptionId:
          input.subscriptionId ?? account.stripeSubscriptionId,
        ...(tierChanged
          ? {
              periodStartedAt: periodStartFor(mapped.tier, now),
              attemptsThisPeriod: 0,
            }
          : {}),
      },
    });
  }

  private async findForStripe(input: {
    userId?: string | null;
    customerId?: string | null;
    subscriptionId?: string | null;
  }): Promise<Account | null> {
    if (input.userId) {
      return this.ensureAccount(input.userId);
    }
    if (input.subscriptionId) {
      const bySub = await this.prisma.account.findUnique({
        where: { stripeSubscriptionId: input.subscriptionId },
      });
      if (bySub) {
        return bySub;
      }
    }
    if (input.customerId) {
      return this.prisma.account.findUnique({
        where: { stripeCustomerId: input.customerId },
      });
    }
    return null;
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

function mapStripeStatus(status: string): {
  tier: AccountTier;
  subscriptionStatus: SubscriptionStatus;
} {
  switch (status) {
    case 'active':
    case 'trialing':
      return { tier: AccountTier.pro, subscriptionStatus: SubscriptionStatus.active };
    case 'past_due':
    case 'unpaid':
      return {
        tier: AccountTier.pro,
        subscriptionStatus: SubscriptionStatus.past_due,
      };
    case 'canceled':
      return {
        tier: AccountTier.free,
        subscriptionStatus: SubscriptionStatus.canceled,
      };
    default:
      return {
        tier: AccountTier.free,
        subscriptionStatus: SubscriptionStatus.expired,
      };
  }
}

function toUsage(account: Account, now = new Date()): AccountUsage {
  const used = effectiveAttemptsThisPeriod(account, now);
  const remaining = remainingAttempts(account, now);
  return {
    tier: account.tier,
    subscriptionStatus: account.subscriptionStatus,
    attemptsThisPeriod: used,
    attemptsRemaining: remaining,
    quotaExceeded: remaining <= 0 && used > 0,
    periodStartedAt: account.periodStartedAt?.toISOString() ?? null,
    dailyRunCount: account.dailyRunCount,
    dailyRunDate: account.dailyRunDate
      ? utcDateOnly(account.dailyRunDate).toISOString()
      : null,
    lastAttemptAt: account.lastAttemptAt?.toISOString() ?? null,
    limits: limitsFor(account.tier),
  };
}
