import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../../core/config/env.schema';
import {
  ModelGateway,
  ModelUnavailableError,
} from '../../grading/gateway/model.gateway';
import {
  citedChunkIds,
  isRefusal,
} from '../../grading/harnesses/rag/grounded-generate';
import { r3UserMessage } from '../../grading/harnesses/rag/r3.grade';
import { REWRITE_MAX_TOKENS } from '../../grading/harnesses/rag/r4.grade';
import type { CorpusDoc } from '../../grading/harnesses/rag/chunking';
import { RagModelUnavailableError } from '../../grading/harnesses/rag/models/model-runtime';
import {
  estimateRagLabWithCorpus,
  previewRagLabWithCorpus,
  ragLabArchetype,
  ragLabFrozen,
  type RagLabArchetype,
  type RagLabPreview,
  type RagLabPublicGold,
  type RagLabPublicItem,
} from '../../grading/harnesses/rag/rag-lab.engine';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  parseRedTeamScenario,
  redTeamScenarioFor,
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
  /** Red team only: public facts about the target bot (never its secrets). */
  target: { botName: string } | null;
};

@Injectable()
export class RagLabService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: ModelGateway,
    private readonly config: ConfigService<Env, true>,
  ) {}

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
      target: archetype === 'redteam' ? await this.targetInfo(exercise) : null,
    };
  }

  private async targetInfo(exercise: {
    slug: string;
    version: number;
  }): Promise<{ botName: string }> {
    const raw = await this.readScenario(exercise);
    return { botName: parseRedTeamScenario(raw).botName };
  }

  private async readScenario(exercise: {
    slug: string;
    version: number;
  }): Promise<unknown> {
    const assets = await this.prisma.exerciseAsset.findUnique({
      where: {
        exerciseSlug_exerciseVersion: {
          exerciseSlug: exercise.slug,
          exerciseVersion: exercise.version,
        },
      },
    });
    if (!assets?.hiddenEvalUri) {
      throw new NotFoundException('Target bot is not configured');
    }
    return JSON.parse(await readAsset(assets.hiddenEvalUri)) as unknown;
  }

  async preview(
    slug: string,
    payload: Record<string, unknown>,
    question?: string,
    queryClass?: string,
    /** R4: run the rewrite prompt on the live model (otherwise skipped). */
    runRewrite = false,
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

    let preview: RagLabPreview;
    try {
      preview = await previewRagLabWithCorpus(
        slug,
        payload,
        selected,
        context.corpus,
        publicGoldFor(exercise.publicSample, selected),
        queryClass ??
          context.questions.find((item) => item.question === selected)?.class ??
          null,
        runRewrite
          ? async (instruction, query) =>
              (
                await this.gateway.generate({
                  runId: null,
                  system: instruction,
                  user: query,
                  maxTokens: REWRITE_MAX_TOKENS,
                })
              ).text
          : null,
      );
    } catch (error) {
      throw labError(error, 'Invalid RAG lab preview payload');
    }
    if (preview.archetype !== 'r3') {
      return preview;
    }
    // R3: the same live model call the grader makes for this question.
    const rawPrompt = (payload as { generationPrompt?: unknown })
      .generationPrompt;
    const generationPrompt = typeof rawPrompt === 'string' ? rawPrompt : '';
    try {
      const { text } = await this.gateway.generate({
        runId: null,
        system: generationPrompt,
        user: r3UserMessage(
          selected,
          preview.retrieved.map((hit) => ({ id: hit.chunkId, text: hit.text })),
        ),
      });
      return {
        ...preview,
        generation: text,
        citations: citedChunkIds(text),
        refused: isRefusal(text),
      };
    } catch (error) {
      if (error instanceof ModelUnavailableError) {
        throw new ServiceUnavailableException(
          'AI generation is not configured on this server.',
        );
      }
      throw error;
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
      return await estimateRagLabWithCorpus(
        slug,
        payload,
        publicItems(exercise.publicSample),
        context.corpus,
      );
    } catch (error) {
      throw labError(error, 'Invalid RAG lab estimate payload');
    }
  }

  /**
   * Talk to a red team exercise's vulnerable bot. The secrets stay server-side,
   * and the flag it can leak is the caller's own (derived from their user id).
   */
  async target(
    slug: string,
    message: string,
    userId: string,
  ): Promise<TargetReply> {
    if (!isRagRedTeamSlug(slug)) {
      throw new BadRequestException('This exercise has no target bot');
    }
    const exercise = await this.loadExercise(slug);
    const scenario = redTeamScenarioFor(await this.readScenario(exercise), {
      secret: this.config.get('REDTEAM_FLAG_SECRET', { infer: true }),
      userId,
      slug: exercise.slug,
    });
    const docs = await this.loadCorpus(slug);
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

/**
 * A config the engine rejects is the learner's to fix (400); a model the
 * server cannot run or reach is not (503).
 */
function labError(error: unknown, fallback: string): Error {
  if (error instanceof ModelUnavailableError) {
    return new ServiceUnavailableException(
      'AI generation is not configured on this server.',
    );
  }
  if (error instanceof RagModelUnavailableError) {
    return new ServiceUnavailableException(
      'The retrieval models are not available on this server yet.',
    );
  }
  return new BadRequestException(
    error instanceof Error ? error.message : fallback,
  );
}
