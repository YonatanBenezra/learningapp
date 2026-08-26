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
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.exercise.count({ where }),
      this.prisma.exercise.findMany({
        where,
        include: withSkills,
        orderBy: [
          { simulator: 'asc' },
          { difficulty: 'asc' },
          { title: 'asc' },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

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
