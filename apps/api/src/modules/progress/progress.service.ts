import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { PrismaService } from '../../core/prisma/prisma.service';
import { calendarDateKey, resolveTimeZone } from './calendar';
import { drillPool, pickDailyDrill } from './daily-drill';
import { HISTORY_LIMIT } from './progress.constants';
import { computeStreak } from './streak';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async getMine(
    user: AuthenticatedUser,
    timezone?: string,
    now = new Date(),
  ) {
    const tz = resolveTimeZone(timezone);
    const todayKey = calendarDateKey(now, tz);

    const [attempts, attemptCount, passRows, published] = await Promise.all([
      this.prisma.attempt.findMany({
        where: { userId: user.id },
        include: {
          exercise: { select: { slug: true, title: true } },
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
        orderBy: { startedAt: 'desc' },
        take: HISTORY_LIMIT,
      }),
      this.prisma.attempt.count({ where: { userId: user.id } }),
      this.prisma.grade.findMany({
        where: {
          verdict: 'pass',
          run: { submission: { attempt: { userId: user.id } } },
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
      this.prisma.exercise.findMany({
        where: { isPublished: true },
        select: {
          slug: true,
          title: true,
          difficulty: true,
          simulator: true,
          type: true,
          version: true,
        },
        orderBy: [{ slug: 'asc' }, { version: 'desc' }],
      }),
    ]);

    const items = attempts.map((attempt) => {
      const run = attempt.submissions[0]?.runs[0];
      return {
        attemptId: attempt.id,
        exerciseSlug: attempt.exercise.slug,
        title: attempt.exercise.title,
        status: attempt.status,
        startedAt: attempt.startedAt,
        runId: run?.id ?? null,
        verdict: run?.grade?.verdict ?? null,
      };
    });

    const solvedSlugs = new Set<string>();
    const qualifiedDays: string[] = [];
    const passedToday = new Set<string>();
    for (const row of passRows) {
      const slug = row.run.submission.attempt.exercise.slug;
      solvedSlugs.add(slug);
      const day = calendarDateKey(row.createdAt, tz);
      qualifiedDays.push(day);
      if (day === todayKey) {
        passedToday.add(slug);
      }
    }

    const skills = await this.prisma.userSkillScore.findMany({
      where: { userId: user.id },
      include: { skill: true },
      orderBy: { skill: { name: 'asc' } },
    });

    const picked = pickDailyDrill(drillPool(published), todayKey);
    const streak = computeStreak(qualifiedDays, todayKey);

    return {
      attempts: attemptCount,
      solves: solvedSlugs.size,
      items,
      skills: skills.map((row) => ({
        slug: row.skill.slug,
        name: row.skill.name,
        score: row.score,
      })),
      streak: {
        current: streak.current,
        longest: streak.longest,
        timezone: tz,
        today: todayKey,
        lastQualifiedDate: streak.lastQualifiedDate,
      },
      dailyDrill: picked
        ? {
            date: todayKey,
            slug: picked.slug,
            title: picked.title,
            difficulty: picked.difficulty,
            simulator: picked.simulator,
            completed: passedToday.has(picked.slug),
          }
        : null,
    };
  }
}
