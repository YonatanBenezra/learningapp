import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountTier,
  ContestEntryStatus,
  type Contest,
} from '@prisma/client';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { randomToken } from '../../common/utils/token-hash';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AccountService } from '../accounts/account.service';
import { publicDisplayName } from '../profiles/profile-slug';
import { itemScoreFromGrade } from './contest-score';
import { sampleFromPool } from './contest-sample';

const PRO_REQUIRED = {
  message: 'Upgrade to Pro to enter contests.',
  code: 'pro_required',
  upgradePath: '/billing',
} as const;

export type ContestListItem = {
  slug: string;
  title: string;
  intent: string;
  startsAt: string;
  endsAt: string;
  timeBoxMinutes: number;
  problemCount: number;
  window: 'upcoming' | 'open' | 'closed';
  entered: boolean;
  canEnter: boolean;
};

export type ContestProblemView = {
  slug: string;
  title: string;
  difficulty: string;
  simulator: string;
  scored: boolean;
  score: number | null;
  verdict: string | null;
};

export type ContestDetail = ContestListItem & {
  sampleSeed: string | null;
  sampledCount: number;
  totalScore: number | null;
  elapsedMs: number | null;
  status: ContestEntryStatus | null;
  problems: ContestProblemView[];
  scorecard: {
    totalScore: number;
    elapsedMs: number;
    items: { slug: string; score: number; verdict: string }[];
  } | null;
};

type ContestWithProblems = Contest & {
  problems: { position: number; exerciseSlug: string }[];
};

@Injectable()
export class ContestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: AccountService,
  ) {}

  async list(user: AuthenticatedUser, now = new Date()): Promise<{ items: ContestListItem[] }> {
    const [contests, entries, account] = await Promise.all([
      this.prisma.contest.findMany({
        where: { isPublished: true },
        include: { problems: true },
        orderBy: [{ startsAt: 'desc' }],
      }),
      this.prisma.contestEntry.findMany({
        where: { userId: user.id },
        select: { contestId: true },
      }),
      this.accounts.usageFor(user.id),
    ]);
    const entered = new Set(entries.map((row) => row.contestId));
    return {
      items: contests.map((contest) =>
        this.toListItem(contest, entered.has(contest.id), account.tier, now),
      ),
    };
  }

  async getBySlug(
    user: AuthenticatedUser,
    slug: string,
    now = new Date(),
  ): Promise<ContestDetail> {
    const contest = await this.loadContest(slug);
    const account = await this.accounts.usageFor(user.id);
    let entry = await this.prisma.contestEntry.findUnique({
      where: {
        contestId_userId: { contestId: contest.id, userId: user.id },
      },
      include: {
        attempts: {
          include: {
            exercise: { select: { slug: true } },
            submissions: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                runs: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                  include: { grade: true },
                },
              },
            },
          },
        },
      },
    });
    if (entry) {
      entry = await this.syncEntry(entry.id, contest, now);
    }
    const entered = Boolean(entry);
    const listItem = this.toListItem(
      contest,
      entered,
      account.tier,
      now,
      entry?.status ?? null,
    );
    const slugs =
      entry?.sampledSlugs ??
      contest.problems.map((problem) => problem.exerciseSlug).slice(0, contest.sampleSize);
    const exercises = await this.loadExerciseMeta(slugs);
    const gradeBySlug = new Map<string, { score: number; verdict: string }>();
    if (entry) {
      for (const attempt of entry.attempts) {
        const run = attempt.submissions[0]?.runs[0];
        const grade = run?.grade;
        if (!grade) {
          continue;
        }
        gradeBySlug.set(attempt.exercise.slug, {
          score: itemScoreFromGrade(grade),
          verdict: grade.verdict,
        });
      }
    }
    const problems: ContestProblemView[] = slugs.flatMap((exerciseSlug) => {
      const exercise = exercises.get(exerciseSlug);
      if (!exercise) {
        return [];
      }
      const scored = gradeBySlug.get(exerciseSlug);
      return [
        {
          slug: exercise.slug,
          title: exercise.title,
          difficulty: exercise.difficulty,
          simulator: exercise.simulator,
          scored: Boolean(scored),
          score: scored?.score ?? null,
          verdict: scored?.verdict ?? null,
        },
      ];
    });
    const scorecard =
      entry && (entry.status === 'finished' || entry.status === 'expired')
        ? {
            totalScore: entry.totalScore,
            elapsedMs: entry.elapsedMs ?? 0,
            items: problems
              .filter((problem) => problem.scored)
              .map((problem) => ({
                slug: problem.slug,
                score: problem.score ?? 0,
                verdict: problem.verdict ?? 'fail',
              })),
          }
        : null;
    return {
      ...listItem,
      sampleSeed: entry?.sampleSeed ?? null,
      sampledCount: slugs.length,
      totalScore: entry?.totalScore ?? null,
      elapsedMs: entry?.elapsedMs ?? null,
      status: entry?.status ?? null,
      problems,
      scorecard,
    };
  }

  async enter(user: AuthenticatedUser, slug: string, now = new Date()) {
    const contest = await this.loadContest(slug);
    const account = await this.accounts.usageFor(user.id);
    if (account.tier !== AccountTier.pro) {
      throw new ForbiddenException(PRO_REQUIRED);
    }
    const window = contestWindow(contest, now);
    if (window !== 'open') {
      throw new BadRequestException(
        window === 'upcoming'
          ? 'This contest has not opened yet.'
          : 'This contest is closed.',
      );
    }
    const existing = await this.prisma.contestEntry.findUnique({
      where: {
        contestId_userId: { contestId: contest.id, userId: user.id },
      },
    });
    if (existing) {
      return this.getBySlug(user, slug, now);
    }
    const pool = contest.problems
      .sort((left, right) => left.position - right.position)
      .map((problem) => problem.exerciseSlug);
    const sampleSeed = randomToken();
    const sampledSlugs = sampleFromPool(pool, contest.sampleSize, sampleSeed);
    await this.prisma.contestEntry.create({
      data: {
        contestId: contest.id,
        userId: user.id,
        sampleSeed,
        sampledSlugs,
      },
    });
    return this.getBySlug(user, slug, now);
  }

  async getExercise(user: AuthenticatedUser, contestSlug: string, exerciseSlug: string) {
    const contest = await this.loadContest(contestSlug);
    const entry = await this.requireActiveEntry(contest.id, user.id);
    if (!entry.sampledSlugs.includes(exerciseSlug)) {
      throw new NotFoundException('Contest problem not found');
    }
    const exercise = await this.prisma.exercise.findFirst({
      where: { slug: exerciseSlug },
      orderBy: { version: 'desc' },
    });
    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }
    return {
      slug: exercise.slug,
      version: exercise.version,
      type: exercise.type,
      simulator: exercise.simulator,
      title: exercise.title,
      briefMd: exercise.briefMd,
      difficulty: exercise.difficulty,
      submissionSchema: exercise.submissionSchema,
      publicSample: exercise.publicSample,
      contestSlug: contest.slug,
      hintsDisabled: true,
    };
  }

  async createAttempt(
    user: AuthenticatedUser,
    contestSlug: string,
    exerciseSlug: string,
    now = new Date(),
  ) {
    const contest = await this.loadContest(contestSlug);
    const entry = await this.requireActiveEntry(contest.id, user.id, now);
    if (!entry.sampledSlugs.includes(exerciseSlug)) {
      throw new NotFoundException('Contest problem not found');
    }
    assertTimeBoxOpen(contest, entry, now);
    const exercise = await this.prisma.exercise.findFirst({
      where: { slug: exerciseSlug },
      orderBy: { version: 'desc' },
    });
    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }
    const attempt = await this.prisma.attempt.create({
      data: {
        userId: user.id,
        exerciseId: exercise.id,
        exerciseVersion: exercise.version,
        contestEntryId: entry.id,
      },
    });
    return {
      id: attempt.id,
      exerciseSlug: exercise.slug,
      exerciseVersion: attempt.exerciseVersion,
      status: attempt.status,
      startedAt: attempt.startedAt,
      contestSlug: contest.slug,
    };
  }

  async assertContestSubmission(
    attemptId: string,
    userId: string,
    now = new Date(),
  ): Promise<void> {
    const attempt = await this.prisma.attempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        contestEntry: { include: { contest: true } },
      },
    });
    if (!attempt?.contestEntry) {
      return;
    }
    assertTimeBoxOpen(attempt.contestEntry.contest, attempt.contestEntry, now);
  }

  async isContestAttempt(attemptId: string, userId: string): Promise<boolean> {
    const attempt = await this.prisma.attempt.findFirst({
      where: { id: attemptId, userId },
      select: { contestEntryId: true },
    });
    return Boolean(attempt?.contestEntryId);
  }

  async latestEndedContest(now = new Date()) {
    return this.prisma.contest.findFirst({
      where: { isPublished: true, endsAt: { lte: now } },
      orderBy: { endsAt: 'desc' },
    });
  }

  async contestBoard(contestId: string) {
    const entries = await this.prisma.contestEntry.findMany({
      where: {
        contestId,
        status: { in: ['finished', 'expired'] },
        user: {
          deletedAt: null,
          profilePublic: true,
          profileSlug: { not: null },
          account: { tier: AccountTier.pro },
        },
      },
      select: {
        totalScore: true,
        elapsedMs: true,
        user: {
          select: {
            displayName: true,
            profileSlug: true,
          },
        },
      },
    });
    return entries.map((entry) => ({
      slug: entry.user.profileSlug as string,
      displayName: publicDisplayName(entry.user.displayName),
      totalScore: entry.totalScore,
      elapsedMs: entry.elapsedMs ?? 0,
    }));
  }

  private async loadContest(slug: string): Promise<ContestWithProblems> {
    const contest = await this.prisma.contest.findFirst({
      where: { slug, isPublished: true },
      include: { problems: { orderBy: { position: 'asc' } } },
    });
    if (!contest) {
      throw new NotFoundException('Contest not found');
    }
    return contest;
  }

  private async requireActiveEntry(
    contestId: string,
    userId: string,
    now = new Date(),
  ) {
    const entry = await this.syncEntryByUser(contestId, userId, now);
    if (!entry) {
      throw new ForbiddenException('Enter the contest before solving problems.');
    }
    if (entry.status !== ContestEntryStatus.active) {
      throw new BadRequestException('This contest attempt is finished.');
    }
    return entry;
  }

  private async syncEntryByUser(contestId: string, userId: string, now: Date) {
    const entry = await this.prisma.contestEntry.findUnique({
      where: { contestId_userId: { contestId, userId } },
    });
    if (!entry) {
      return null;
    }
    return this.syncEntry(entry.id, await this.prisma.contest.findUniqueOrThrow({
      where: { id: contestId },
      include: { problems: true },
    }), now);
  }

  private async syncEntry(
    entryId: string,
    contest: ContestWithProblems,
    now: Date,
  ) {
    const current = await this.prisma.contestEntry.findUniqueOrThrow({
      where: { id: entryId },
      include: {
        attempts: {
          include: {
            exercise: { select: { slug: true } },
            submissions: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                runs: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                  include: { grade: true },
                },
              },
            },
          },
        },
      },
    });
    if (current.status !== ContestEntryStatus.active) {
      return current;
    }
    const scored = new Map<string, { score: number; finishedAt: Date | null }>();
    for (const attempt of current.attempts) {
      const run = attempt.submissions[0]?.runs[0];
      const grade = run?.grade;
      if (!grade) {
        continue;
      }
      scored.set(attempt.exercise.slug, {
        score: itemScoreFromGrade(grade),
        finishedAt: run.finishedAt ?? run.createdAt,
      });
    }
    const allGraded = current.sampledSlugs.every((slug) => scored.has(slug));
    const expired = !isWithinTimeBox(contest, current.startedAt, now);
    if (!allGraded && !expired) {
      return current;
    }
    const itemScores = current.sampledSlugs.map(
      (slug) => scored.get(slug)?.score ?? 0,
    );
    const finishTimes = current.sampledSlugs
      .map((slug) => scored.get(slug)?.finishedAt)
      .filter((value): value is Date => value instanceof Date);
    const elapsedAnchor =
      finishTimes.length > 0
        ? new Date(Math.max(...finishTimes.map((value) => value.getTime())))
        : now;
    const elapsedMs = Math.max(0, elapsedAnchor.getTime() - current.startedAt.getTime());
    const nextStatus =
      allGraded || expired
        ? expired && !allGraded
          ? ContestEntryStatus.expired
          : ContestEntryStatus.finished
        : current.status;
    return this.prisma.contestEntry.update({
      where: { id: entryId },
      data: {
        totalScore: itemScores.reduce((sum, score) => sum + score, 0),
        elapsedMs,
        finishedAt: now,
        status: nextStatus,
      },
      include: {
        attempts: {
          include: {
            exercise: { select: { slug: true } },
            submissions: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                runs: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                  include: { grade: true },
                },
              },
            },
          },
        },
      },
    });
  }

  private toListItem(
    contest: ContestWithProblems,
    entered: boolean,
    tier: AccountTier,
    now: Date,
    entryStatus: ContestEntryStatus | null = null,
  ): ContestListItem {
    const window = contestWindow(contest, now);
    const canEnter =
      tier === AccountTier.pro &&
      window === 'open' &&
      !entered &&
      entryStatus !== ContestEntryStatus.finished &&
      entryStatus !== ContestEntryStatus.expired;
    return {
      slug: contest.slug,
      title: contest.title,
      intent: contest.intent,
      startsAt: contest.startsAt.toISOString(),
      endsAt: contest.endsAt.toISOString(),
      timeBoxMinutes: contest.timeBoxMinutes,
      problemCount: contest.problems.length,
      window,
      entered,
      canEnter,
    };
  }

  private async loadExerciseMeta(slugs: string[]) {
    const rows = await this.prisma.exercise.findMany({
      where: { slug: { in: slugs } },
      select: {
        slug: true,
        title: true,
        difficulty: true,
        simulator: true,
        version: true,
      },
      orderBy: { version: 'desc' },
    });
    const latest = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      if (!latest.has(row.slug)) {
        latest.set(row.slug, row);
      }
    }
    return latest;
  }
}

function contestWindow(
  contest: Pick<Contest, 'startsAt' | 'endsAt'>,
  now: Date,
): 'upcoming' | 'open' | 'closed' {
  if (now < contest.startsAt) {
    return 'upcoming';
  }
  if (now > contest.endsAt) {
    return 'closed';
  }
  return 'open';
}

function isWithinTimeBox(
  contest: Pick<Contest, 'timeBoxMinutes'>,
  startedAt: Date,
  now: Date,
): boolean {
  const deadline = startedAt.getTime() + contest.timeBoxMinutes * 60_000;
  return now.getTime() <= deadline;
}

function assertTimeBoxOpen(
  contest: Pick<Contest, 'timeBoxMinutes'>,
  entry: { startedAt: Date },
  now: Date,
): void {
  if (!isWithinTimeBox(contest, entry.startedAt, now)) {
    throw new BadRequestException('Your contest time box has expired.');
  }
}
