import { Injectable } from '@nestjs/common';
import { AccountTier } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { publicDisplayName } from '../profiles/profile-slug';
import {
  LEADERBOARD_RULE,
  RECENT_PASS_WINDOW_MS,
  leaderboardRating,
  sortLeaderboardRows,
} from './leaderboard-rank';

export type LeaderboardEntry = {
  rank: number;
  slug: string;
  displayName: string;
  solves: number;
  recentPasses: number;
  rating: number;
};

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async list(now = new Date()): Promise<{
    rule: string;
    items: LeaderboardEntry[];
  }> {
    const candidates = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        profilePublic: true,
        profileSlug: { not: null },
        account: { tier: AccountTier.pro },
      },
      select: {
        id: true,
        displayName: true,
        profileSlug: true,
      },
    });
    if (candidates.length === 0) {
      return { rule: LEADERBOARD_RULE, items: [] };
    }

    const cutoff = new Date(now.getTime() - RECENT_PASS_WINDOW_MS);
    const passes = await this.prisma.grade.findMany({
      where: {
        verdict: 'pass',
        run: {
          submission: {
            attempt: { userId: { in: candidates.map((row) => row.id) } },
          },
        },
      },
      select: {
        createdAt: true,
        run: {
          select: {
            submission: {
              select: {
                attempt: {
                  select: {
                    userId: true,
                    exercise: { select: { slug: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const byUser = new Map<
      string,
      { slugs: Set<string>; recentPasses: number }
    >();
    for (const candidate of candidates) {
      byUser.set(candidate.id, { slugs: new Set(), recentPasses: 0 });
    }
    for (const row of passes) {
      const attempt = row.run.submission.attempt;
      const bucket = byUser.get(attempt.userId);
      if (!bucket) {
        continue;
      }
      bucket.slugs.add(attempt.exercise.slug);
      if (row.createdAt >= cutoff) {
        bucket.recentPasses += 1;
      }
    }

    const ranked = sortLeaderboardRows(
      candidates.map((candidate) => {
        const stats = byUser.get(candidate.id) ?? {
          slugs: new Set<string>(),
          recentPasses: 0,
        };
        return {
          slug: candidate.profileSlug as string,
          displayName: publicDisplayName(candidate.displayName),
          solves: stats.slugs.size,
          recentPasses: stats.recentPasses,
          rating: leaderboardRating(stats.slugs.size, stats.recentPasses),
        };
      }),
    );

    return {
      rule: LEADERBOARD_RULE,
      items: ranked.map((row, index) => ({
        rank: index + 1,
        slug: row.slug,
        displayName: row.displayName,
        solves: row.solves,
        recentPasses: row.recentPasses,
        rating: row.rating,
      })),
    };
  }
}
