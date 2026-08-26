import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { writeTraceBlob } from '../../../common/utils/trace-blob';
import type { CorpusDoc } from '../harnesses/rag/chunking';
import { EvaluationHarness } from '../harnesses/evaluation/evaluation.harness';
import type { EvalItem } from '../harnesses/evaluation/eval.types';
import { GuardrailsHarness } from '../harnesses/guardrails/guardrails.harness';
import { RagHarness } from '../harnesses/rag/rag.harness';
import type { HiddenItem } from '../harnesses/rag/rag.types';
import { WORKER_VERSION } from '../processors/grade-job';

type PipelineResult = {
  verdict: 'pass' | 'fail' | 'inconclusive';
  metrics: unknown;
  gateResults: unknown;
  failureClasses: string[];
  scorecard: unknown;
  failingCases: unknown;
  trace: unknown;
  sampleSeed?: string;
};

@Injectable()
export class GradingPipeline {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ragHarness: RagHarness,
    private readonly evaluationHarness: EvaluationHarness,
    private readonly guardrailsHarness: GuardrailsHarness,
  ) {}

  async run(runId: string): Promise<void> {
    const run = await this.prisma.run.findUniqueOrThrow({
      where: { id: runId },
      include: {
        submission: {
          include: {
            attempt: {
              include: {
                exercise: { include: { skills: true } },
              },
            },
          },
        },
        grade: true,
      },
    });
    if (run.grade) {
      if (run.status !== 'succeeded') {
        await this.prisma.run.update({
          where: { id: runId },
          data: { status: 'succeeded', finishedAt: new Date() },
        });
      }
      return;
    }

    const exercise = run.submission.attempt.exercise;
    const assets = await this.prisma.exerciseAsset.findUnique({
      where: {
        exerciseSlug_exerciseVersion: {
          exerciseSlug: exercise.slug,
          exerciseVersion: exercise.version,
        },
      },
    });
    if (!assets?.hiddenEvalUri) {
      throw new Error(`Missing harness assets for ${exercise.slug}`);
    }

    const hidden = JSON.parse(await readAsset(assets.hiddenEvalUri)) as unknown;
    const publicItems = publicQuestions(exercise.publicSample);
    let result: PipelineResult;
    if (exercise.simulator === 'rag') {
      if (!assets.corpusUri) {
        throw new Error(`Missing corpus for ${exercise.slug}`);
      }
      const docs = JSON.parse(await readAsset(assets.corpusUri)) as CorpusDoc[];
      result = await this.ragHarness.execute({
        slug: exercise.slug,
        runId,
        payload: run.submission.payload,
        docs,
        hidden: hidden as HiddenItem[],
        publicItems,
      });
    } else if (exercise.simulator === 'evaluation') {
      result = await this.evaluationHarness.execute({
        slug: exercise.slug,
        runId,
        payload: run.submission.payload,
        hidden: hidden as EvalItem[],
        publicItems: hiddenPublic(exercise.publicSample),
      });
    } else if (exercise.simulator === 'guardrails') {
      result = await this.guardrailsHarness.execute({
        slug: exercise.slug,
        runId,
        payload: run.submission.payload,
        hidden,
        publicItems: hiddenPublic(exercise.publicSample),
      });
    } else {
      throw new Error(`Unsupported simulator: ${exercise.simulator}`);
    }

    const blobUri = await writeTraceBlob(runId, result.trace);
    const passed = result.verdict === 'pass';
    const practicedAt = new Date();
    const userId = run.submission.attempt.userId;

    await this.prisma.$transaction([
      this.prisma.grade.create({
        data: {
          runId,
          verdict: result.verdict,
          metrics: result.metrics as Prisma.InputJsonValue,
          gateResults: result.gateResults as Prisma.InputJsonValue,
          failureClasses: result.failureClasses,
          scorecard: result.scorecard as Prisma.InputJsonValue,
          failingCases: result.failingCases as Prisma.InputJsonValue,
        },
      }),
      this.prisma.trace.create({
        data: { runId, blobUri },
      }),
      this.prisma.run.update({
        where: { id: runId },
        data: {
          status: 'succeeded',
          finishedAt: practicedAt,
          workerVersion: WORKER_VERSION,
          ...(result.sampleSeed ? { sampleSeed: result.sampleSeed } : {}),
        },
      }),
      this.prisma.attempt.update({
        where: { id: run.submission.attemptId },
        data: { status: 'graded' },
      }),
      ...exercise.skills.map((row) =>
        this.prisma.userSkillScore.upsert({
          where: {
            userId_skillId: { userId, skillId: row.skillId },
          },
          create: {
            userId,
            skillId: row.skillId,
            score: passed ? 1 : 0,
            lastPracticedAt: practicedAt,
          },
          update: {
            lastPracticedAt: practicedAt,
            ...(passed ? { score: 1 } : {}),
          },
        }),
      ),
    ]);
  }
}

function publicQuestions(value: unknown): { question: string }[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const questions: { question: string }[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object' || !('question' in item)) {
      continue;
    }
    const question = (item as { question: unknown }).question;
    if (typeof question === 'string') {
      questions.push({ question });
    }
  }
  return questions;
}

function hiddenPublic(value: unknown): EvalItem[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (item): item is EvalItem => Boolean(item) && typeof item === 'object',
  );
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
