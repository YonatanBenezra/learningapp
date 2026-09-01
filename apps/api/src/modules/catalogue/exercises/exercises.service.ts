import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQuery } from '../../../common/dto/pagination.query';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { toCatalogueDetail, toCatalogueListItem } from './exercises.mapper';

const withSkills = {
  skills: { include: { skill: true } },
} satisfies Prisma.ExerciseInclude;

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PaginationQuery) {
    const page = query.page;
    const pageSize = query.pageSize;
    const where = { isPublished: true };
    const latest = await this.prisma.exercise.findMany({
      where,
      distinct: ['slug'],
      orderBy: [{ slug: 'asc' }, { version: 'desc' }],
      include: withSkills,
    });
    latest.sort((left, right) => {
      if (left.simulator !== right.simulator) {
        return left.simulator.localeCompare(right.simulator);
      }
      if (left.difficulty !== right.difficulty) {
        return left.difficulty.localeCompare(right.difficulty);
      }
      return left.title.localeCompare(right.title);
    });
    const total = latest.length;
    const rows = latest.slice((page - 1) * pageSize, page * pageSize);

    return {
      items: rows.map(toCatalogueListItem),
      page,
      pageSize,
      total,
    };
  }

  async getBySlug(slug: string) {
    const exercise = await this.prisma.exercise.findFirst({
      where: { slug, isPublished: true },
      include: withSkills,
      orderBy: { version: 'desc' },
    });
    if (!exercise) {
      throw new NotFoundException();
    }
    return toCatalogueDetail(exercise);
  }
}
