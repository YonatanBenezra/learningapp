import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '../../../common/constants/roles';
import { PrismaService } from '../../../core/prisma/prisma.service';
import type { PublicUser } from '../auth/auth.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string): Promise<PublicUser> {
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
    };
  }
}
