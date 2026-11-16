import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CorpusDoc } from '../../grading/harnesses/rag/chunking';
import {
  estimateRagLabWithCorpus,
  previewRagLabWithCorpus,
  ragLabArchetype,
  ragLabFrozen,
  type RagLabArchetype,
  type RagLabPublicGold,
  type RagLabPublicItem,
} from '../../grading/harnesses/rag/rag-lab.engine';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  parseRedTeamScenario,
  runTargetBot,
  type TargetReply,
} from '../../grading/harnesses/rag/redteam';
import { isRagRedTeamSlug } from './exercises.constants';

export type RagLabQuestion = {
  id: string;
  question: string;
  answerable: boolean;
  goldAnswer: string | null;
  /** R5 query class, when the exercise routes by question type. */
  class: string | null;
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
    queryClass?: string,
  ) {
    const exercise = await this.loadExercise(slug);
    const context = await this.getContext(slug);
    if (!context.labEnabled) {
      throw new BadRequestException(
        'RAG lab is not available for this exercise',
      );
    }
    const selected =
      question?.trim() ||
      context.questions[0]?.question ||
      'How many PTO days do full-time staff get each year?';

    try {
      return previewRagLabWithCorpus(
        slug,
        payload,
        selected,
        context.corpus,
        publicGoldFor(exercise.publicSample, selected),
        queryClass ??
          context.questions.find((item) => item.question === selected)?.class ??
          null,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Invalid RAG lab preview payload';
      throw new BadRequestException(message);
    }
  }

  async estimate(slug: string, payload: Record<string, unknown>) {
    const exercise = await this.loadExercise(slug);
    const context = await this.getContext(slug);
    if (!context.labEnabled) {
      throw new BadRequestException(
        'RAG lab is not available for this exercise',
      );
    }
    try {
      return estimateRagLabWithCorpus(
        slug,
        payload,
        publicItems(exercise.publicSample),
        context.corpus,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Invalid RAG lab estimate payload';
      throw new BadRequestException(message);
    }
  }

  /** Talk to a red team exercise's vulnerable bot. The secrets stay server-side. */
  async target(slug: string, message: string): Promise<TargetReply> {
    if (!isRagRedTeamSlug(slug)) {
      throw new BadRequestException('This exercise has no target bot');
    }
    const exercise = await this.loadExercise(slug);
    const assets = await this.prisma.exerciseAsset.findUnique({
      where: {
        exerciseSlug_exerciseVersion: {
          exerciseSlug: exercise.slug,
          exerciseVersion: exercise.version,
        },
      },
    });
    if (!assets?.hiddenEvalUri || !assets.corpusUri) {
      throw new NotFoundException('Target bot is not configured');
    }
    const scenario = parseRedTeamScenario(
      JSON.parse(await readAsset(assets.hiddenEvalUri)) as unknown,
    );
    const docs = JSON.parse(await readAsset(assets.corpusUri)) as CorpusDoc[];
    return runTargetBot(scenario, docs, message);
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
      throw new BadRequestException(
        'RAG lab is only available for RAG exercises',
      );
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
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === 'object',
    )
    .map((item, index) => ({
      id: typeof item.id === 'string' ? item.id : `q${index + 1}`,
      question: typeof item.question === 'string' ? item.question : '',
      answerable: item.answerable !== false,
      goldAnswer:
        typeof item.goldAnswer === 'string'
          ? item.goldAnswer
          : item.goldAnswer === null
            ? null
            : null,
      class: typeof item.class === 'string' ? item.class : null,
    }))
    .filter((item) => item.question.length > 0);
}

function publicItems(publicSample: unknown): RagLabPublicItem[] {
  if (!Array.isArray(publicSample)) {
    return [];
  }
  return publicSample
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof (item as Record<string, unknown>).question === 'string',
    )
    .map((item, index) => ({
      id: typeof item.id === 'string' ? item.id : `q${index + 1}`,
      question: item.question as string,
      answerable: item.answerable !== false,
      gold: publicGoldFor(publicSample, item.question as string),
      queryClass: typeof item.class === 'string' ? item.class : null,
    }));
}

/**
 * Gold label for a question that is one of the exercise's PUBLIC samples, so the
 * lab can show whether retrieval found the answer. Custom queries get none, and
 * hidden-set labels are never read here.
 */
function publicGoldFor(
  publicSample: unknown,
  question: string,
): RagLabPublicGold | null {
  if (!Array.isArray(publicSample)) {
    return null;
  }
  const normalized = question.trim().toLowerCase();
  for (const item of publicSample) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as Record<string, unknown>;
    if (
      typeof row.question === 'string' &&
      row.question.trim().toLowerCase() === normalized &&
      typeof row.goldDocId === 'string' &&
      typeof row.goldSpan === 'string'
    ) {
      return { goldDocId: row.goldDocId, goldSpan: row.goldSpan };
    }
  }
  return null;
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
