import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async getMine(user: AuthenticatedUser) {
    const attempts = await this.prisma.attempt.findMany({
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
    });

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

    const solvedSlugs = new Set(
      items
        .filter((item) => item.verdict === 'pass')
        .map((item) => item.exerciseSlug),
    );

    const skills = await this.prisma.userSkillScore.findMany({
      where: { userId: user.id },
      include: { skill: true },
      orderBy: { skill: { name: 'asc' } },
    });

    return {
      attempts: items.length,
      solves: solvedSlugs.size,
      items,
      skills: skills.map((row) => ({
        slug: row.skill.slug,
        name: row.skill.name,
        score: row.score,
      })),
    };
  }
}
