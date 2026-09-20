import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CorpusDoc } from '../../grading/harnesses/rag/chunking';
import {
  previewRagLabWithCorpus,
  ragLabArchetype,
  ragLabFrozen,
  type RagLabArchetype,
} from '../../grading/harnesses/rag/rag-lab.engine';
import { PrismaService } from '../../../core/prisma/prisma.service';

export type RagLabQuestion = {
  id: string;
  question: string;
  answerable: boolean;
  goldAnswer: string | null;
};

export type RagLabContext = {
  slug: string;
  archetype: RagLabArchetype;
  corpus: CorpusDoc[];
  questions: RagLabQuestion[];
  frozen: ReturnType<typeof ragLabFrozen>;
  labEnabled: boolean;
};

@Injectable()
export class RagLabService {
  constructor(private readonly prisma: PrismaService) {}

  async getContext(slug: string): Promise<RagLabContext> {
    const exercise = await this.loadExercise(slug);
    const archetype = ragLabArchetype(slug);
    const labEnabled = archetype !== 'sandbox' && exercise.simulator === 'rag';

    let corpus: CorpusDoc[] = [];
    if (labEnabled) {
      corpus = await this.loadCorpus(slug);
    }

    return {
      slug,
      archetype,
      corpus,
      questions: publicQuestions(exercise.publicSample),
      frozen: ragLabFrozen(slug),
      labEnabled,
    };
  }

  async preview(
    slug: string,
    payload: Record<string, unknown>,
    question?: string,
  ) {
    const context = await this.getContext(slug);
    if (!context.labEnabled) {
      throw new BadRequestException('RAG lab is not available for this exercise');
    }
    const selected =
      question?.trim() ||
      context.questions[0]?.question ||
      'How many PTO days do full-time staff get each year?';

    try {
      return previewRagLabWithCorpus(slug, payload, selected, context.corpus);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid RAG lab preview payload';
      throw new BadRequestException(message);
    }
  }

  private async loadExercise(slug: string) {
    const exercise = await this.prisma.exercise.findFirst({
      where: { slug, isPublished: true },
      orderBy: { version: 'desc' },
    });
    if (!exercise) {
      throw new NotFoundException();
    }
    if (exercise.simulator !== 'rag') {
      throw new BadRequestException('RAG lab is only available for RAG exercises');
    }
    return exercise;
  }

  private async loadCorpus(slug: string): Promise<CorpusDoc[]> {
    const exercise = await this.prisma.exercise.findFirst({
      where: { slug, isPublished: true },
      orderBy: { version: 'desc' },
    });
    if (!exercise) {
      throw new NotFoundException();
    }
    const assets = await this.prisma.exerciseAsset.findUnique({
      where: {
        exerciseSlug_exerciseVersion: {
          exerciseSlug: exercise.slug,
          exerciseVersion: exercise.version,
        },
      },
    });
    if (!assets?.corpusUri) {
      throw new NotFoundException('Corpus not found for this exercise');
    }
    const raw = await readAsset(assets.corpusUri);
    return JSON.parse(raw) as CorpusDoc[];
  }
}

function publicQuestions(value: unknown): RagLabQuestion[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item, index) => ({
      id: typeof item.id === 'string' ? item.id : `q${index + 1}`,
      question: String(item.question ?? ''),
      answerable: item.answerable !== false,
      goldAnswer:
        typeof item.goldAnswer === 'string'
          ? item.goldAnswer
          : item.goldAnswer === null
            ? null
            : null,
    }))
    .filter((item) => item.question.length > 0);
}

async function readAsset(uri: string): Promise<string> {
  if (!uri.startsWith('file:')) {
    throw new Error(`Unsupported asset URI: ${uri}`);
  }
  const filePath = path.resolve(uri.slice('file:'.length));
  const allowed =
    filePath.includes(`${path.sep}content${path.sep}exercises${path.sep}`) ||
    filePath.includes(`${path.sep}content${path.sep}corpora${path.sep}`);
  if (!allowed) {
    throw new Error('Refusing to read an asset outside content/');
  }
  return readFile(filePath, 'utf8');
}
