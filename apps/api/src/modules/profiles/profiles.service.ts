import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AccountService } from '../accounts/account.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateProfileMetaDto } from './dto/update-profile-meta.dto';
import { parseProfileMeta, type ProfileMeta } from './profile-meta';
import { toProfileSettings } from './profile-settings';
import {
  buildWorkspacePayload,
  buildXpDays,
  computePracticeRating,
  mergeMetaSkills,
  qualifiedDaysFromPasses,
} from './profile-workspace';
import { calendarDateKey } from '../progress/calendar';
import { computeStreak } from '../progress/streak';
import { toSkillScoreView } from '../skills/skill-decay';
import {
  leaderboardRating,
  RECENT_PASS_WINDOW_MS,
} from '../leaderboard/leaderboard-rank';
import {
  parseProfileSlug,
  publicDisplayName,
  RECENT_SOLVE_LIMIT,
} from './profile-slug';
import { toPublicVerifiedResult } from '../assessments/public-verified-result';

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

    const [passRows, skills, contestRating, verifiedRows, attemptCount] =
      await Promise.all([
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
        this.bestContestRating(user.id),
        this.prisma.signedAssessmentResult.findMany({
          where: {
            userId: user.id,
            sharedPublicAt: { not: null },
            revokedAt: null,
          },
          orderBy: { issuedAt: 'desc' },
        }),
        this.prisma.attempt.count({ where: { userId: user.id } }),
      ]);

    const solved = new Map<
      string,
      { slug: string; title: string; passedAt: Date }
    >();
    // One clock for every decayed row in this response.
    const now = new Date();
    const recentCutoff = new Date(now.getTime() - RECENT_PASS_WINDOW_MS);
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

    const practiceRating = leaderboardRating(solved.size, recentPasses);
    const qualifiedDays = passRows.map((row) =>
      calendarDateKey(row.createdAt, 'UTC'),
    );
    const streak = computeStreak(qualifiedDays, calendarDateKey(now, 'UTC'));

    return {
      slug: user.profileSlug,
      displayName: publicDisplayName(user.displayName),
      solves: solved.size,
      attempts: attemptCount,
      rating: contestRating ?? practiceRating,
      contestRating,
      practiceRating,
      streak: {
        current: streak.current,
        longest: streak.longest,
      },
      verifiedResults: verifiedRows.map((row) => toPublicVerifiedResult(row)),
      skills: skills.map((row) => toSkillScoreView(row, now)),
      recent: [...solved.values()].slice(0, RECENT_SOLVE_LIMIT).map((row) => ({
        slug: row.slug,
        title: row.title,
        passedAt: row.passedAt.toISOString(),
      })),
    };
  }

  async getWorkspace(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException();
    }
    const account = await this.accounts.usageFor(userId);

    const [passWithExercise, attemptRows, skills, attemptCount] =
      await Promise.all([
        this.prisma.grade.findMany({
          where: {
            verdict: 'pass',
            run: { submission: { attempt: { userId } } },
          },
          select: {
            createdAt: true,
            run: {
              select: {
                submission: {
                  select: {
                    attempt: {
                      select: { exercise: { select: { slug: true } } },
                    },
                  },
                },
              },
            },
          },
        }),
        this.prisma.attempt.findMany({
          where: { userId },
          select: { startedAt: true },
          orderBy: { startedAt: 'desc' },
          take: 500,
        }),
        this.prisma.userSkillScore.findMany({
          where: { userId },
          include: { skill: true },
        }),
        this.prisma.attempt.count({ where: { userId } }),
      ]);

    const solvedSlugs = new Set<string>();
    for (const row of passWithExercise) {
      solvedSlugs.add(row.run.submission.attempt.exercise.slug);
    }
    const passRows = passWithExercise;

    const now = new Date();
    const { rating } = computePracticeRating(
      solvedSlugs.size,
      passRows,
      now,
    );
    const contestRating = await this.bestContestRating(userId);
    const effectiveRating = contestRating ?? rating;

    const qualifiedDays = qualifiedDaysFromPasses(passRows);
    const streak = computeStreak(
      qualifiedDays,
      calendarDateKey(now, 'UTC'),
    );

    const meta = parseProfileMeta(user.profileMeta);
    const skillNames = skills.map((row) =>
      toSkillScoreView(row, now).name,
    );
    const mergedMeta = mergeMetaSkills(meta, skillNames);

    const xpDays = buildXpDays(
      attemptRows.map((r) => r.startedAt.toISOString()),
      passRows.map((r) => r.createdAt.toISOString()),
    );

    return buildWorkspacePayload({
      email: user.email,
      displayName: user.displayName,
      profileSlug: user.profileSlug,
      profilePublic: user.profilePublic,
      imageUrl: user.imageUrl,
      meta: mergedMeta,
      solves: solvedSlugs.size,
      attempts: attemptCount,
      rating: effectiveRating,
      streakCurrent: streak.current,
      streakLongest: streak.longest,
      xpDays,
      tier: account.tier,
    });
  }

  async updateMeta(userId: string, dto: UpdateProfileMetaDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException();
    }
    const current = parseProfileMeta(user.profileMeta);
    const next: ProfileMeta = {
      ...current,
      ...dto,
      accountSettings: dto.accountSettings
        ? { ...current.accountSettings, ...dto.accountSettings }
        : current.accountSettings,
      socials: dto.socials ?? current.socials,
      interests: dto.interests ?? current.interests,
      skills: dto.skills ?? current.skills,
      tools: dto.tools ?? current.tools,
      languages: dto.languages ?? current.languages,
      certifications: dto.certifications ?? current.certifications,
      achievements: dto.achievements ?? current.achievements,
      events: dto.events ?? current.events,
      badges: dto.badges ?? current.badges,
    };
    await this.prisma.user.update({
      where: { id: userId },
      data: { profileMeta: next as object },
    });
    return next;
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
      if (dto.enabled && !nextSlug) {
        throw new BadRequestException(
          'Choose a profile URL before publishing.',
        );
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

  private async bestContestRating(userId: string): Promise<number | null> {
    const row = await this.prisma.contestEntry.findFirst({
      where: {
        userId,
        status: { in: ['finished', 'expired'] },
        contest: { isPublished: true, endsAt: { lte: new Date() } },
      },
      orderBy: [{ totalScore: 'desc' }, { elapsedMs: 'asc' }],
      select: { totalScore: true },
    });
    return row?.totalScore ?? null;
  }
}
