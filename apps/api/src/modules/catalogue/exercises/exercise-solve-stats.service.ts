import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';

export type UserExerciseSolveStat = {
  /** Passes ÷ graded attempts on this exercise (0–100). */
  solveRate: number;
  gradedAttempts: number;
  passCount: number;
  cleared: boolean;
};

@Injectable()
export class ExerciseSolveStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async userStatsBySlug(
    userId: string,
  ): Promise<Record<string, UserExerciseSolveStat>> {
    const grades = await this.prisma.grade.findMany({
      where: {
        run: { submission: { attempt: { userId } } },
      },
      select: {
        verdict: true,
        run: {
          select: {
            submission: {
              select: {
                attempt: {
                  select: {
                    exercise: { select: { slug: true, isPublished: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const acc = new Map<string, { pass: number; total: number }>();
    for (const grade of grades) {
      const exercise = grade.run.submission.attempt.exercise;
      if (!exercise.isPublished) {
        continue;
      }
      const row = acc.get(exercise.slug) ?? { pass: 0, total: 0 };
      row.total += 1;
      if (grade.verdict === 'pass') {
        row.pass += 1;
      }
      acc.set(exercise.slug, row);
    }

    const out: Record<string, UserExerciseSolveStat> = {};
    for (const [slug, row] of acc) {
      out[slug] = {
        gradedAttempts: row.total,
        passCount: row.pass,
        solveRate: Math.round((100 * row.pass) / row.total),
        cleared: row.pass > 0,
      };
    }
    return out;
  }
}
