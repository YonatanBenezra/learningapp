import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountTier,
  ContestEntryStatus,
  ContestKind,
  type Contest,
} from '@prisma/client';
import { ASSESSMENT_SEASON_USED } from '../assessments/assessments.constants';
import { buildAssessmentResult } from '../assessments/assessment-result';
import { currentAssessmentSeasonKey } from '../assessments/assessment-season';
import type { AssessmentResult } from '../assessments/assessment-result';
import { SignedResultsService } from '../assessments/signed-results.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { randomToken } from '../../common/utils/token-hash';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AccountService } from '../accounts/account.service';
import { publicDisplayName } from '../profiles/profile-slug';
import {
  assignRanks,
  countGradedSlugs,
  type LeaderboardEntryRow,
} from './contest-leaderboard';
import { itemScoreFromGrade } from './contest-score';
import {
  contestScoringMeta,
  samplingModeFromDb,
} from './contest-scoring';
import { buildContestClock } from './contest-clock';
import { resolveSampledSlugs } from './contest-sample';
import { leaderboardToCsv } from './contest-leaderboard-csv';
import {
  resolveVirtualSampledSlugs,
  virtualSampleSeed,
} from './contest-virtual';
import type { ContestLeaderboardQueryDto } from './dto/contest-leaderboard-query.dto';

export type ContestListItem = {
  slug: string;
  title: string;
  intent: string;
  kind: ContestKind;
  seasonKey: string | null;
  startsAt: string;
  endsAt: string;
  timeBoxMinutes: number;
  problemCount: number;
  window: 'upcoming' | 'open' | 'closed';
  entered: boolean;
  canEnter: boolean;
  startedAt: string | null;
  windowDeadlineAt: string | null;
  personalDeadlineAt: string | null;
  samplingMode: 'fixed_pool' | 'per_user';
  pointsPerProblem: number;
  maxScore: number;
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

export type ContestLeaderboardItem = {
  rank: number;
  displayName: string;
  profileSlug: string | null;
  totalScore: number;
  elapsedMs: number | null;
  solvedCount: number;
  totalCount: number;
  status: ContestEntryStatus;
  isYou: boolean;
};

export type ContestLeaderboard = {
  contest: {
    slug: string;
    title: string;
    window: 'upcoming' | 'open' | 'closed';
    pointsPerProblem: number;
    maxScore: number;
  };
  page: number;
  pageSize: number;
  total: number;
  items: ContestLeaderboardItem[];
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
    maxScore: number;
    elapsedMs: number;
    items: { slug: string; score: number; verdict: string }[];
    result: AssessmentResult | null;
    signed: {
      id: string;
      keyId: string;
      issuedAt: string;
      revokedAt: string | null;
      revokeReasonCode: string | null;
      signatureValid: boolean;
    } | null;
  } | null;
  virtualPracticeAvailable: boolean;
};

export type ContestVirtualDetail = {
  slug: string;
  title: string;
  mode: 'virtual';
  sampleSeed: string;
  sampledCount: number;
  pointsPerProblem: number;
  maxScore: number;
  problems: ContestProblemView[];
};

type ContestWithProblems = Contest & {
  problems: { position: number; exerciseSlug: string }[];
};

@Injectable()
export class ContestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: AccountService,
    private readonly signedResults: SignedResultsService,
  ) {}

  async list(
    user: AuthenticatedUser | undefined,
    kind: ContestKind = ContestKind.contest,
    now = new Date(),
  ): Promise<{ items: ContestListItem[] }> {
    const [contests, entries, tier, seasonSittingUsed] = await Promise.all([
      this.prisma.contest.findMany({
        where: { isPublished: true, kind },
        include: { problems: true },
        orderBy: [{ startsAt: 'desc' }],
      }),
      user
        ? this.prisma.contestEntry.findMany({
            where: { userId: user.id },
            select: { contestId: true },
          })
        : Promise.resolve([]),
      user
        ? this.accounts.usageFor(user.id).then((usage) => usage.tier)
        : Promise.resolve(AccountTier.free),
      user && kind === ContestKind.assessment
        ? this.hasAssessmentSeasonEntry(user.id, now)
        : Promise.resolve(false),
    ]);
    const entered = new Set(entries.map((row) => row.contestId));
    return {
      items: contests.map((contest) =>
        this.toListItem(
          contest,
          entered.has(contest.id),
          tier,
          now,
          null,
          seasonSittingUsed,
        ),
      ),
    };
  }

  async getBySlug(
    user: AuthenticatedUser,
    slug: string,
    now = new Date(),
    expectedKind: ContestKind = ContestKind.contest,
  ): Promise<ContestDetail> {
    const contest = await this.loadContest(slug, expectedKind);
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
    const seasonSittingUsed =
      contest.kind === ContestKind.assessment
        ? await this.hasAssessmentSeasonEntry(user.id, now)
        : false;
    const listItem = this.toListItem(
      contest,
      entered,
      account.tier,
      now,
      entry?.status ?? null,
      seasonSittingUsed,
    );
    const slugs =
      entry?.sampledSlugs ??
      contest.problems
        .map((problem) => problem.exerciseSlug)
        .slice(0, contest.sampleSize);
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
          score: itemScoreFromGrade(grade, contest.pointsPerProblem),
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
    const scoredItems = problems.map((problem) => ({
      slug: problem.slug,
      title: problem.title,
      score: problem.score ?? 0,
      verdict: problem.verdict ?? (problem.scored ? 'fail' : 'pending'),
    }));
    let scorecard: ContestDetail['scorecard'] = null;
    if (entry && (entry.status === 'finished' || entry.status === 'expired')) {
      const skillsByProblem = await this.loadExerciseSkills(entry.sampledSlugs);
      const result = buildAssessmentResult({
        kind: contest.kind,
        seasonKey: contest.seasonKey,
        startsAt: contest.startsAt,
        endsAt: contest.endsAt,
        timeBoxMinutes: contest.timeBoxMinutes,
        sampleSeed: entry.sampleSeed,
        elapsedMs: entry.elapsedMs ?? 0,
        problems: scoredItems,
        skillsByProblem,
      });
      let signedRow = await this.signedResults.findByContestEntry(entry.id);
      if (!signedRow && contest.kind === ContestKind.assessment) {
        signedRow = await this.signedResults.issueForEntry(entry.id);
      }
      scorecard = {
        totalScore: entry.totalScore,
        maxScore:
          contestScoringMeta(contest, scoredItems.length).maxScore,
        elapsedMs: entry.elapsedMs ?? 0,
        items: scoredItems.map(({ slug, score, verdict }) => ({
          slug,
          score,
          verdict,
        })),
        result,
        signed: signedRow
          ? {
              id: signedRow.id,
              keyId: signedRow.keyId,
              issuedAt: signedRow.issuedAt,
              revokedAt: signedRow.revokedAt,
              revokeReasonCode: signedRow.revokeReasonCode,
              signatureValid: signedRow.signatureValid,
            }
          : null,
      };
    }
    const clock = buildContestClock(
      contest,
      listItem.window,
      entry,
      now,
    );
    const scoring = contestScoringMeta(contest, slugs.length);
    const liveTotal = problems.reduce(
      (sum, problem) => sum + (problem.score ?? 0),
      0,
    );
    return {
      ...listItem,
      ...scoring,
      ...clock,
      virtualPracticeAvailable:
        contest.kind === ContestKind.contest && listItem.window === 'closed',
      sampleSeed: entry?.sampleSeed ?? null,
      sampledCount: slugs.length,
      totalScore:
        entry?.status === 'active'
          ? liveTotal || entry.totalScore
          : entry?.totalScore ?? null,
      elapsedMs: entry?.elapsedMs ?? null,
      status: entry?.status ?? null,
      problems,
      scorecard,
    };
  }

  async enter(
    user: AuthenticatedUser,
    slug: string,
    now = new Date(),
    expectedKind: ContestKind = ContestKind.contest,
  ) {
    const contest = await this.loadContest(slug, expectedKind);
    const window = contestWindow(contest, now);
    if (window !== 'open') {
      throw new BadRequestException(
        window === 'upcoming'
          ? contest.kind === ContestKind.assessment
            ? 'This assessment window has not opened yet.'
            : 'This contest has not opened yet.'
          : contest.kind === ContestKind.assessment
            ? 'This assessment window is closed.'
            : 'This contest is closed.',
      );
    }
    const existing = await this.prisma.contestEntry.findUnique({
      where: {
        contestId_userId: { contestId: contest.id, userId: user.id },
      },
    });
    if (existing) {
      return this.getBySlug(user, slug, now, expectedKind);
    }
    if (contest.kind === ContestKind.assessment) {
      await this.assertAssessmentSeasonAvailable(user.id, contest, now);
    }
    const pool = contest.problems
      .sort((left, right) => left.position - right.position)
      .map((problem) => problem.exerciseSlug);
    const sampleSeed = randomToken();
    const sampledSlugs = resolveSampledSlugs(
      pool,
      contest.sampleSize,
      sampleSeed,
      samplingModeFromDb(contest.samplingMode),
    );
    await this.prisma.contestEntry.create({
      data: {
        contestId: contest.id,
        userId: user.id,
        sampleSeed,
        sampledSlugs,
      },
    });
    return this.getBySlug(user, slug, now, expectedKind);
  }

  async getExercise(
    user: AuthenticatedUser,
    contestSlug: string,
    exerciseSlug: string,
    expectedKind: ContestKind = ContestKind.contest,
  ) {
    const contest = await this.loadContest(contestSlug, expectedKind);
    const now = new Date();
    const entry = await this.requireActiveEntry(contest.id, user.id, now);
    const window = contestWindow(contest, now);
    const clock = buildContestClock(contest, window, entry, now);
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
      sittingKind: contest.kind,
      hintsDisabled: true,
      clock: {
        window,
        startedAt: clock.startedAt,
        windowDeadlineAt: clock.windowDeadlineAt,
        personalDeadlineAt: clock.personalDeadlineAt,
        entryStatus: entry.status,
      },
      scoring: {
        ...contestScoringMeta(contest, entry.sampledSlugs.length),
        entryTotalScore: entry.totalScore,
      },
    };
  }

  async createAttempt(
    user: AuthenticatedUser,
    contestSlug: string,
    exerciseSlug: string,
    now = new Date(),
    expectedKind: ContestKind = ContestKind.contest,
  ) {
    const contest = await this.loadContest(contestSlug, expectedKind);
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

  async getVirtual(
    user: AuthenticatedUser,
    slug: string,
    now = new Date(),
    expectedKind: ContestKind = ContestKind.contest,
  ): Promise<ContestVirtualDetail> {
    const contest = await this.loadContest(slug, expectedKind);
    this.assertVirtualPractice(contest, now);
    const pool = this.contestPoolOrdered(contest);
    const sampledSlugs = resolveVirtualSampledSlugs(contest, pool, user.id);
    const exercises = await this.loadExerciseMeta(sampledSlugs);
    const problems: ContestProblemView[] = sampledSlugs.flatMap((exerciseSlug) => {
      const exercise = exercises.get(exerciseSlug);
      if (!exercise) {
        return [];
      }
      return [
        {
          slug: exercise.slug,
          title: exercise.title,
          difficulty: exercise.difficulty,
          simulator: exercise.simulator,
          scored: false,
          score: null,
          verdict: null,
        },
      ];
    });
    const scoring = contestScoringMeta(contest, sampledSlugs.length);
    return {
      slug: contest.slug,
      title: contest.title,
      mode: 'virtual',
      sampleSeed: virtualSampleSeed(user.id, contest.id),
      sampledCount: sampledSlugs.length,
      ...scoring,
      problems,
    };
  }

  async getVirtualExercise(
    user: AuthenticatedUser,
    contestSlug: string,
    exerciseSlug: string,
    expectedKind: ContestKind = ContestKind.contest,
  ) {
    const contest = await this.loadContest(contestSlug, expectedKind);
    const now = new Date();
    this.assertVirtualPractice(contest, now);
    const pool = this.contestPoolOrdered(contest);
    const sampledSlugs = resolveVirtualSampledSlugs(contest, pool, user.id);
    if (!sampledSlugs.includes(exerciseSlug)) {
      throw new NotFoundException('Virtual contest problem not found');
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
      sittingKind: contest.kind,
      hintsDisabled: true,
      mode: 'virtual' as const,
      scoring: contestScoringMeta(contest, sampledSlugs.length),
    };
  }

  async createVirtualAttempt(
    user: AuthenticatedUser,
    contestSlug: string,
    exerciseSlug: string,
    now = new Date(),
    expectedKind: ContestKind = ContestKind.contest,
  ) {
    const contest = await this.loadContest(contestSlug, expectedKind);
    this.assertVirtualPractice(contest, now);
    const pool = this.contestPoolOrdered(contest);
    const sampledSlugs = resolveVirtualSampledSlugs(contest, pool, user.id);
    if (!sampledSlugs.includes(exerciseSlug)) {
      throw new NotFoundException('Virtual contest problem not found');
    }
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
      },
    });
    return {
      id: attempt.id,
      exerciseSlug: exercise.slug,
      exerciseVersion: attempt.exerciseVersion,
      status: attempt.status,
      startedAt: attempt.startedAt,
      contestSlug: contest.slug,
      mode: 'virtual' as const,
    };
  }

  async exportLeaderboardCsv(
    slug: string,
    expectedKind: ContestKind = ContestKind.contest,
    now = new Date(),
  ): Promise<string> {
    const board = await this.leaderboard(
      slug,
      { page: 1, pageSize: 10_000 },
      undefined,
      now,
      expectedKind,
    );
    return leaderboardToCsv(slug, board.items);
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

  async isActiveAssessmentAttempt(
    attemptId: string,
    userId: string,
  ): Promise<boolean> {
    const attempt = await this.prisma.attempt.findFirst({
      where: { id: attemptId, userId },
      select: {
        contestEntry: {
          select: {
            status: true,
            contest: { select: { kind: true } },
          },
        },
      },
    });
    return (
      attempt?.contestEntry?.contest.kind === ContestKind.assessment &&
      attempt.contestEntry.status === ContestEntryStatus.active
    );
  }

  async latestEndedContest(now = new Date()) {
    return this.prisma.contest.findFirst({
      where: { isPublished: true, endsAt: { lte: now } },
      orderBy: { endsAt: 'desc' },
    });
  }

  async leaderboard(
    slug: string,
    query: ContestLeaderboardQueryDto,
    user: AuthenticatedUser | undefined,
    now = new Date(),
    expectedKind: ContestKind = ContestKind.contest,
  ): Promise<ContestLeaderboard> {
    const contest = await this.loadContest(slug, expectedKind);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;

    const statusFilter: ContestEntryStatus[] = [
      ContestEntryStatus.finished,
      ContestEntryStatus.expired,
    ];
    if (contest.rankingIncludesActive) {
      statusFilter.unshift(ContestEntryStatus.active);
    }

    const entries = await this.prisma.contestEntry.findMany({
      where: {
        contestId: contest.id,
        status: { in: statusFilter },
        user: { deletedAt: null },
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            profileSlug: true,
            profilePublic: true,
          },
        },
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

    const rows: LeaderboardEntryRow[] = entries.map((entry) => ({
      userId: entry.userId,
      displayName: publicDisplayName(entry.user.displayName),
      profileSlug:
        entry.user.profilePublic && entry.user.profileSlug
          ? entry.user.profileSlug
          : null,
      totalScore: this.entryLiveTotalScore(entry, contest.pointsPerProblem),
      elapsedMs: entry.elapsedMs,
      solvedCount: countGradedSlugs(entry.sampledSlugs, entry.attempts),
      totalCount: entry.sampledSlugs.length,
      status: entry.status,
      startedAt: entry.startedAt,
    }));

    const ranked = assignRanks(rows);
    const total = ranked.length;
    const start = (page - 1) * pageSize;
    const slice = ranked.slice(start, start + pageSize);

    const scoring = contestScoringMeta(
      contest,
      contest.sampleSize,
    );
    return {
      contest: {
        slug: contest.slug,
        title: contest.title,
        window: contestWindow(contest, now),
        pointsPerProblem: scoring.pointsPerProblem,
        maxScore: scoring.maxScore,
      },
      page,
      pageSize,
      total,
      items: slice.map((row) => ({
        rank: row.rank,
        displayName: row.displayName,
        profileSlug: row.profileSlug,
        totalScore: row.totalScore,
        elapsedMs: row.elapsedMs,
        solvedCount: row.solvedCount,
        totalCount: row.totalCount,
        status: row.status,
        isYou: user?.id === row.userId,
      })),
    };
  }

  async contestBoard(contestId: string) {
    const contest = await this.prisma.contest.findUniqueOrThrow({
      where: { id: contestId },
    });
    const board = await this.leaderboard(
      contest.slug,
      { page: 1, pageSize: 100 },
      undefined,
    );
    return board.items
      .filter((row) => row.profileSlug)
      .map((row) => ({
        slug: row.profileSlug as string,
        displayName: row.displayName,
        totalScore: row.totalScore,
        elapsedMs: row.elapsedMs ?? 0,
      }));
  }

  private contestPoolOrdered(contest: ContestWithProblems): string[] {
    return contest.problems
      .sort((left, right) => left.position - right.position)
      .map((problem) => problem.exerciseSlug);
  }

  private assertVirtualPractice(
    contest: Pick<Contest, 'kind' | 'startsAt' | 'endsAt'>,
    now: Date,
  ): void {
    if (contest.kind !== ContestKind.contest) {
      throw new BadRequestException(
        'Virtual practice is only available for timed contests.',
      );
    }
    if (contestWindow(contest, now) !== 'closed') {
      throw new BadRequestException(
        'Virtual practice opens after the contest window closes.',
      );
    }
  }

  private async loadContest(
    slug: string,
    expectedKind: ContestKind = ContestKind.contest,
  ): Promise<ContestWithProblems> {
    const contest = await this.prisma.contest.findFirst({
      where: { slug, isPublished: true, kind: expectedKind },
      include: { problems: { orderBy: { position: 'asc' } } },
    });
    if (!contest) {
      throw new NotFoundException(
        expectedKind === ContestKind.assessment
          ? 'Assessment not found'
          : 'Contest not found',
      );
    }
    return contest;
  }

  private async hasAssessmentSeasonEntry(
    userId: string,
    now: Date,
  ): Promise<boolean> {
    const seasonKey = currentAssessmentSeasonKey(now);
    const used = await this.prisma.contestEntry.findFirst({
      where: {
        userId,
        contest: {
          kind: ContestKind.assessment,
          seasonKey,
        },
      },
      select: { id: true },
    });
    return Boolean(used);
  }

  private async assertAssessmentSeasonAvailable(
    userId: string,
    contest: Pick<Contest, 'seasonKey' | 'startsAt'>,
    now: Date,
  ): Promise<void> {
    void now;
    const seasonKey =
      contest.seasonKey ?? currentAssessmentSeasonKey(contest.startsAt);
    const used = await this.prisma.contestEntry.findFirst({
      where: {
        userId,
        contest: {
          kind: ContestKind.assessment,
          seasonKey,
        },
      },
      select: { id: true },
    });
    if (used) {
      throw new BadRequestException(ASSESSMENT_SEASON_USED);
    }
  }

  private async requireActiveEntry(
    contestId: string,
    userId: string,
    now = new Date(),
  ) {
    const entry = await this.syncEntryByUser(contestId, userId, now);
    if (!entry) {
      throw new ForbiddenException(
        'Enter the contest before solving problems.',
      );
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
    return this.syncEntry(
      entry.id,
      await this.prisma.contest.findUniqueOrThrow({
        where: { id: contestId },
        include: { problems: true },
      }),
      now,
    );
  }

  private entryLiveTotalScore(
    entry: {
      totalScore: number;
      sampledSlugs: string[];
      attempts: {
        exercise: { slug: string };
        submissions: {
          runs: { grade: Parameters<typeof itemScoreFromGrade>[0] | null }[];
        }[];
      }[];
    },
    pointsPerProblem: number,
  ): number {
    const bySlug = new Map<string, number>();
    for (const attempt of entry.attempts) {
      const grade = attempt.submissions[0]?.runs[0]?.grade;
      if (!grade) {
        continue;
      }
      bySlug.set(
        attempt.exercise.slug,
        itemScoreFromGrade(grade, pointsPerProblem),
      );
    }
    let sum = 0;
    for (const slug of entry.sampledSlugs) {
      sum += bySlug.get(slug) ?? 0;
    }
    return bySlug.size > 0 ? sum : entry.totalScore;
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
    const scored = new Map<
      string,
      { score: number; finishedAt: Date | null }
    >();
    for (const attempt of current.attempts) {
      const run = attempt.submissions[0]?.runs[0];
      const grade = run?.grade;
      if (!grade) {
        continue;
      }
      scored.set(attempt.exercise.slug, {
        score: itemScoreFromGrade(grade, contest.pointsPerProblem),
        finishedAt: run.finishedAt ?? run.createdAt,
      });
    }
    const itemScores = current.sampledSlugs.map(
      (slug) => scored.get(slug)?.score ?? 0,
    );
    const partialTotal = itemScores.reduce((sum, score) => sum + score, 0);
    const allGraded = current.sampledSlugs.every((slug) => scored.has(slug));
    const expired = !isWithinTimeBox(contest, current.startedAt, now);
    if (!allGraded && !expired) {
      if (partialTotal !== current.totalScore) {
        return this.prisma.contestEntry.update({
          where: { id: entryId },
          data: { totalScore: partialTotal },
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
      return current;
    }
    const finishTimes = current.sampledSlugs
      .map((slug) => scored.get(slug)?.finishedAt)
      .filter((value): value is Date => value instanceof Date);
    const elapsedAnchor =
      finishTimes.length > 0
        ? new Date(Math.max(...finishTimes.map((value) => value.getTime())))
        : now;
    const elapsedMs = Math.max(
      0,
      elapsedAnchor.getTime() - current.startedAt.getTime(),
    );
    const nextStatus =
      allGraded || expired
        ? expired && !allGraded
          ? ContestEntryStatus.expired
          : ContestEntryStatus.finished
        : current.status;
    const updated = await this.prisma.contestEntry.update({
      where: { id: entryId },
      data: {
        totalScore: partialTotal,
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
    if (
      nextStatus !== ContestEntryStatus.active &&
      contest.kind === ContestKind.assessment
    ) {
      await this.signedResults.issueForEntry(updated.id);
    }
    return updated;
  }

  private toListItem(
    contest: ContestWithProblems,
    entered: boolean,
    _tier: AccountTier,
    now: Date,
    entryStatus: ContestEntryStatus | null = null,
    seasonSittingUsed = false,
  ): ContestListItem {
    const window = contestWindow(contest, now);
    const canEnter =
      window === 'open' &&
      !entered &&
      entryStatus !== ContestEntryStatus.finished &&
      entryStatus !== ContestEntryStatus.expired &&
      !(contest.kind === ContestKind.assessment && seasonSittingUsed);
    const clock = buildContestClock(contest, window, null, now);
    const sampleCount = Math.min(contest.sampleSize, contest.problems.length);
    const scoring = contestScoringMeta(contest, sampleCount);
    return {
      slug: contest.slug,
      title: contest.title,
      intent: contest.intent,
      kind: contest.kind,
      seasonKey: contest.seasonKey,
      startsAt: contest.startsAt.toISOString(),
      endsAt: contest.endsAt.toISOString(),
      timeBoxMinutes: contest.timeBoxMinutes,
      problemCount: contest.problems.length,
      window,
      entered,
      canEnter,
      startedAt: clock.startedAt,
      windowDeadlineAt: clock.windowDeadlineAt,
      personalDeadlineAt: clock.personalDeadlineAt,
      ...scoring,
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

  private async loadExerciseSkills(slugs: string[]) {
    const rows = await this.prisma.exercise.findMany({
      where: { slug: { in: slugs } },
      select: {
        slug: true,
        skills: {
          select: {
            skill: { select: { slug: true, name: true } },
          },
        },
      },
      orderBy: { version: 'desc' },
    });
    const latest = new Map<string, { slug: string; name: string }[]>();
    for (const row of rows) {
      if (latest.has(row.slug)) {
        continue;
      }
      latest.set(
        row.slug,
        row.skills.map((link) => ({
          slug: link.skill.slug,
          name: link.skill.name,
        })),
      );
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
    throw new BadRequestException('Your sitting time box has expired.');
  }
}
