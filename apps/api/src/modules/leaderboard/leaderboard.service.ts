import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { publicDisplayName } from '../profiles/profile-slug';
import {
  LEADERBOARD_RULE,
  RECENT_PASS_WINDOW_MS,
  leaderboardRating,
  sortLeaderboardRows,
} from './leaderboard-rank';
import {
  emptyTrackCounts,
  simulatorToTrack,
  streakDaysFromPassDates,
  strongestTracksFromCounts,
  type LeaderboardTrackKey,
} from './leaderboard-tracks';

export type LeaderboardEntry = {
  rank: number;
  slug: string;
  displayName: string;
  solves: number;
  recentPasses: number;
  rating: number;
  streakDays: number;
  trackPasses: Record<LeaderboardTrackKey, number>;
  strongestTracks: LeaderboardTrackKey[];
};

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async list(now = new Date()): Promise<{
    rule: string;
    items: LeaderboardEntry[];
  }> {
    return this.listPractice(now);
  }

  private async listPractice(now: Date): Promise<{
    rule: string;
    items: LeaderboardEntry[];
  }> {
    const candidates = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        profilePublic: true,
        profileSlug: { not: null },
        NOT: { email: { endsWith: '@labpath.test', mode: 'insensitive' } },
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
                    exercise: {
                      select: {
                        slug: true,
                        isPublished: true,
                        simulator: true,
                      },
                    },
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
      {
        slugs: Set<string>;
        recentPasses: number;
        trackSlugs: Record<LeaderboardTrackKey, Set<string>>;
        passDates: Date[];
      }
    >();
    for (const candidate of candidates) {
      byUser.set(candidate.id, {
        slugs: new Set(),
        recentPasses: 0,
        trackSlugs: {
          rag: new Set(),
          eval: new Set(),
          guard: new Set(),
          prompt: new Set(),
        },
        passDates: [],
      });
    }
    for (const row of passes) {
      const attempt = row.run.submission.attempt;
      if (!attempt.exercise.isPublished) {
        continue;
      }
      const bucket = byUser.get(attempt.userId);
      if (!bucket) {
        continue;
      }
      const slug = attempt.exercise.slug;
      bucket.slugs.add(slug);
      bucket.passDates.push(row.createdAt);
      const track = simulatorToTrack(attempt.exercise.simulator);
      if (track) {
        bucket.trackSlugs[track].add(slug);
      }
      if (row.createdAt >= cutoff) {
        bucket.recentPasses += 1;
      }
    }

    const ranked = sortLeaderboardRows(
      candidates
        .map((candidate) => {
          const stats = byUser.get(candidate.id) ?? {
            slugs: new Set<string>(),
            recentPasses: 0,
            trackSlugs: {
              rag: new Set<string>(),
              eval: new Set<string>(),
              guard: new Set<string>(),
              prompt: new Set<string>(),
            },
            passDates: [],
          };
          const trackPasses = emptyTrackCounts();
          for (const key of Object.keys(trackPasses) as LeaderboardTrackKey[]) {
            trackPasses[key] = stats.trackSlugs[key].size;
          }
          const strongestTracks = strongestTracksFromCounts(trackPasses);
          return {
            slug: candidate.profileSlug as string,
            displayName: publicDisplayName(candidate.displayName),
            solves: stats.slugs.size,
            recentPasses: stats.recentPasses,
            rating: leaderboardRating(stats.slugs.size, stats.recentPasses),
            streakDays: streakDaysFromPassDates(stats.passDates),
            trackPasses,
            strongestTracks,
          };
        })
        .filter((row) => row.solves > 0),
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
        streakDays: row.streakDays,
        trackPasses: row.trackPasses,
        strongestTracks: row.strongestTracks,
      })),
    };
  }
}
