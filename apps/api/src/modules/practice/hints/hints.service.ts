import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { PrismaService } from '../../../core/prisma/prisma.service';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type HintList = {
  unlocked: { index: number; text: string }[];
  remaining: number;
};

@Injectable()
export class HintsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthenticatedUser, slug: string): Promise<HintList> {
    const exercise = await this.published(slug);
    const hints = await loadHints(slug);
    const count = await this.prisma.hintUnlock.count({
      where: { userId: user.id, exerciseId: exercise.id },
    });
    return toList(hints, count);
  }

  async unlockNext(user: AuthenticatedUser, slug: string): Promise<HintList> {
    const exercise = await this.published(slug);
    const hints = await loadHints(slug);
    if (hints.length === 0) {
      throw new NotFoundException('No hints for this exercise');
    }
    const count = await this.prisma.hintUnlock.count({
      where: { userId: user.id, exerciseId: exercise.id },
    });
    if (count >= hints.length) {
      throw new BadRequestException('No more hints');
    }
    await this.prisma.hintUnlock.create({
      data: {
        userId: user.id,
        exerciseId: exercise.id,
        hintIndex: count,
      },
    });
    return toList(hints, count + 1);
  }

  private async published(slug: string) {
    if (!SLUG.test(slug)) {
      throw new NotFoundException('Exercise not found');
    }
    const exercise = await this.prisma.exercise.findFirst({
      where: { slug, isPublished: true },
      orderBy: { version: 'desc' },
    });
    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }
    return exercise;
  }
}

function toList(hints: string[], count: number): HintList {
  return {
    unlocked: hints.slice(0, count).map((text, index) => ({ index, text })),
    remaining: Math.max(0, hints.length - count),
  };
}

async function loadHints(slug: string): Promise<string[]> {
  const filePath = path.join(
    process.cwd(),
    'content',
    'exercises',
    slug,
    'hints.json',
  );
  const marker = `${path.sep}content${path.sep}exercises${path.sep}`;
  if (!filePath.includes(marker)) {
    return [];
  }
  try {
    const raw = JSON.parse(await readFile(filePath, 'utf8')) as unknown;
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}
