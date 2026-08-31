import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { pathProgress } from './path-progress';

export type PathListItem = {
  slug: string;
  title: string;
  intent: string;
  stepCount: number;
  passedCount: number;
  nextSlug: string | null;
  complete: boolean;
};

export type PathDetail = PathListItem & {
  steps: {
    position: number;
    slug: string;
    title: string;
    difficulty: string;
    simulator: string;
    passed: boolean;
  }[];
};

@Injectable()
export class PathsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthenticatedUser): Promise<{ items: PathListItem[] }> {
    const [paths, passed] = await Promise.all([
      this.loadPublished(),
      this.passedSlugs(user.id),
    ]);
    return {
      items: paths.map((path) => this.toListItem(path, passed)),
    };
  }

  async getBySlug(user: AuthenticatedUser, slug: string): Promise<PathDetail> {
    const [row, passed] = await Promise.all([
      this.prisma.guidedPath.findFirst({
        where: { slug, isPublished: true },
        include: { steps: { orderBy: { position: 'asc' } } },
      }),
      this.passedSlugs(user.id),
    ]);
    if (!row) {
      throw new NotFoundException();
    }
    const progress = this.toListItem(row, passed);
    const slugs = row.steps.map((step) => step.exerciseSlug);
    const exercises = await this.prisma.exercise.findMany({
      where: { slug: { in: slugs }, isPublished: true },
      select: {
        slug: true,
        title: true,
        difficulty: true,
        simulator: true,
        version: true,
      },
      orderBy: { version: 'desc' },
    });
    const latest = new Map<string, (typeof exercises)[number]>();
    for (const exercise of exercises) {
      if (!latest.has(exercise.slug)) {
        latest.set(exercise.slug, exercise);
      }
    }
    return {
      ...progress,
      steps: row.steps.flatMap((step) => {
        const exercise = latest.get(step.exerciseSlug);
        if (!exercise) {
          return [];
        }
        return [
          {
            position: step.position,
            slug: exercise.slug,
            title: exercise.title,
            difficulty: exercise.difficulty,
            simulator: exercise.simulator,
            passed: passed.has(exercise.slug),
          },
        ];
      }),
    };
  }

  private async loadPublished() {
    return this.prisma.guidedPath.findMany({
      where: { isPublished: true },
      include: { steps: { orderBy: { position: 'asc' } } },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
  }

  private async passedSlugs(userId: string): Promise<Set<string>> {
    const rows = await this.prisma.grade.findMany({
      where: {
        verdict: 'pass',
        run: { submission: { attempt: { userId } } },
      },
      select: {
        run: {
          select: {
            submission: {
              select: { attempt: { select: { exercise: { select: { slug: true } } } } },
            },
          },
        },
      },
    });
    const slugs = new Set<string>();
    for (const row of rows) {
      slugs.add(row.run.submission.attempt.exercise.slug);
    }
    return slugs;
  }

  private toListItem(
    path: { slug: string; title: string; intent: string; steps: { exerciseSlug: string }[] },
    passed: ReadonlySet<string>,
  ): PathListItem {
    const steps = path.steps.map((step) => step.exerciseSlug);
    return {
      slug: path.slug,
      title: path.title,
      intent: path.intent,
      ...pathProgress(steps, passed),
    };
  }
}
