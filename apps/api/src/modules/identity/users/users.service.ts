import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UserRole } from '../../../common/constants/roles';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { AccountService } from '../../accounts/account.service';
import type { AccountUsage } from '../../accounts/account.types';
import type { PublicUser } from '../auth/auth.service';
import {
  elapsedMs,
  ONBOARDING_EXERCISE_SLUG,
  ONBOARDING_STARTER,
  type OnboardingEventName,
  type OnboardingState,
} from './onboarding';

export type MeResponse = PublicUser & {
  account: AccountUsage;
  onboarding: OnboardingState;
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: AccountService,
  ) {}

  async getMe(userId: string): Promise<MeResponse> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException();
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      displayName: user.displayName,
      account: await this.accounts.usageFor(userId),
      onboarding: await this.onboardingFor(userId, user.createdAt),
    };
  }

  async trackOnboarding(
    userId: string,
    name: OnboardingEventName,
  ): Promise<{ name: OnboardingEventName; elapsedMs: number }> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException();
    }
    const elapsed = elapsedMs(user.createdAt);
    this.logger.log(`onboarding.${name} user=${userId} elapsedMs=${elapsed}`);
    return { name, elapsedMs: elapsed };
  }

  private async onboardingFor(
    userId: string,
    createdAt: Date,
  ): Promise<OnboardingState> {
    const [firstSubmit, firstPass] = await Promise.all([
      this.prisma.submission.findFirst({
        where: { attempt: { userId } },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      this.prisma.grade.findFirst({
        where: {
          verdict: 'pass',
          run: { submission: { attempt: { userId } } },
        },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
    ]);
    return {
      needed: !firstSubmit,
      exerciseSlug: ONBOARDING_EXERCISE_SLUG,
      starter: { ...ONBOARDING_STARTER },
      createdAt: createdAt.toISOString(),
      timeToFirstSubmitMs: firstSubmit
        ? elapsedMs(createdAt, firstSubmit.createdAt)
        : null,
      timeToFirstPassMs: firstPass
        ? elapsedMs(createdAt, firstPass.createdAt)
        : null,
    };
  }
}
