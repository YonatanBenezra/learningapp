import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateAttemptDto } from './dto/create-attempt.dto';

@Injectable()
export class AttemptsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthenticatedUser, dto: CreateAttemptDto) {
    const exercise = await this.prisma.exercise.findFirst({
      where: { slug: dto.exerciseSlug, isPublished: true },
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
    };
  }
}
