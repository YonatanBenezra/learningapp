import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '../../../common/constants/roles';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { AccountService } from '../../accounts/account.service';
import type { AccountUsage } from '../../accounts/account.types';
import type { PublicUser } from '../auth/auth.service';

export type MeResponse = PublicUser & {
  account: AccountUsage;
};

@Injectable()
export class UsersService {
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
    };
  }
}
