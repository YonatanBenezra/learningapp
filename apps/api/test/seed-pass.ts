import { Prisma } from '@prisma/client';
import { PrismaService } from '../src/core/prisma/prisma.service';

export async function seedPass(
  prisma: PrismaService,
  userId: string,
  slug: string,
  at: Date,
  verdict: 'pass' | 'fail' = 'pass',
) {
  const exercise = await prisma.exercise.findFirst({
    where: { slug, isPublished: true },
    orderBy: { version: 'desc' },
  });
  if (!exercise) {
    throw new Error(`missing ${slug}`);
  }
  const attempt = await prisma.attempt.create({
    data: {
      userId,
      exerciseId: exercise.id,
      exerciseVersion: exercise.version,
      status: 'graded',
      startedAt: at,
    },
  });
  const submission = await prisma.submission.create({
    data: {
      attemptId: attempt.id,
      payload: {},
      payloadHash: `hash-${attempt.id}`,
      createdAt: at,
    },
  });
  const run = await prisma.run.create({
    data: {
      submissionId: submission.id,
      workerVersion: 'test',
      modelVersions: {},
      fxRate: new Prisma.Decimal(1),
      status: 'succeeded',
      createdAt: at,
      finishedAt: at,
    },
  });
  await prisma.grade.create({
    data: {
      runId: run.id,
      verdict,
      metrics: {},
      gateResults: {},
      failureClasses: [],
      scorecard: {},
      failingCases: {},
      createdAt: at,
    },
  });
  return { attemptId: attempt.id, runId: run.id };
}
