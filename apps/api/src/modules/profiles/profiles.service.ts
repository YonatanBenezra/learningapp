import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccountTier, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AccountService } from '../accounts/account.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { toProfileSettings } from './profile-settings';
import {
  leaderboardRating,
  RECENT_PASS_WINDOW_MS,
} from '../leaderboard/leaderboard-rank';
import {
  parseProfileSlug,
  publicDisplayName,
  RECENT_SOLVE_LIMIT,
} from './profile-slug';

const PRO_REQUIRED = {
  message: 'Upgrade to Pro to publish a public profile.',
  code: 'pro_required',
  upgradePath: '/billing',
} as const;

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: AccountService,
  ) {}

  async getPublic(slug: string) {
    const normalized = slug.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        profileSlug: normalized,
        profilePublic: true,
        deletedAt: null,
        account: { tier: AccountTier.pro },
      },
      select: {
        id: true,
        displayName: true,
        profileSlug: true,
      },
    });
    if (!user?.profileSlug) {
      throw new NotFoundException();
    }

    const [passRows, skills] = await Promise.all([
      this.prisma.grade.findMany({
        where: {
          verdict: 'pass',
          run: { submission: { attempt: { userId: user.id } } },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          createdAt: true,
          run: {
            select: {
              submission: {
                select: {
                  attempt: {
                    select: {
                      exercise: { select: { slug: true, title: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.userSkillScore.findMany({
        where: { userId: user.id },
        include: { skill: true },
        orderBy: { skill: { name: 'asc' } },
      }),
    ]);

    const solved = new Map<string, { slug: string; title: string; passedAt: Date }>();
    const recentCutoff = new Date(Date.now() - RECENT_PASS_WINDOW_MS);
    let recentPasses = 0;
    for (const row of passRows) {
      const exercise = row.run.submission.attempt.exercise;
      if (!solved.has(exercise.slug)) {
        solved.set(exercise.slug, {
          slug: exercise.slug,
          title: exercise.title,
          passedAt: row.createdAt,
        });
      }
      if (row.createdAt >= recentCutoff) {
        recentPasses += 1;
      }
    }

    return {
      slug: user.profileSlug,
      displayName: publicDisplayName(user.displayName),
      solves: solved.size,
      rating: leaderboardRating(solved.size, recentPasses),
      skills: skills.map((row) => ({
        slug: row.skill.slug,
        name: row.skill.name,
        score: row.score,
      })),
      recent: [...solved.values()]
        .slice(0, RECENT_SOLVE_LIMIT)
        .map((row) => ({
          slug: row.slug,
          title: row.title,
          passedAt: row.passedAt.toISOString(),
        })),
    };
  }

  async update(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException();
    }
    const account = await this.accounts.usageFor(userId);

    const data: {
      displayName?: string | null;
      profileSlug?: string | null;
      profilePublic?: boolean;
    } = {};
    if (dto.displayName !== undefined) {
      const trimmed = dto.displayName?.trim() ?? '';
      data.displayName = trimmed.length > 0 ? trimmed : null;
    }
    if (dto.slug !== undefined) {
      data.profileSlug =
        dto.slug === null || dto.slug.trim() === ''
          ? null
          : parseProfileSlug(dto.slug);
    }
    const nextSlug =
      data.profileSlug !== undefined ? data.profileSlug : user.profileSlug;
    if (dto.enabled !== undefined) {
      if (dto.enabled && account.tier !== AccountTier.pro) {
        throw new ForbiddenException(PRO_REQUIRED);
      }
      if (dto.enabled && !nextSlug) {
        throw new BadRequestException('Choose a profile URL before publishing.');
      }
      data.profilePublic = dto.enabled;
    }
    if (nextSlug === null) {
      data.profilePublic = false;
    }

    try {
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data,
      });
      return toProfileSettings(updated, account.tier);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('That profile URL is taken.');
      }
      throw error;
    }
  }
}
