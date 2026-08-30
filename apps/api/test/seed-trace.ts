import { Prisma } from '@prisma/client';
import { writeTraceBlob } from '../src/common/utils/trace-blob';
import { PrismaService } from '../src/core/prisma/prisma.service';
import { R1_SLUG } from '../src/modules/catalogue/exercises/exercises.constants';

export async function seedR1Trace(
  prisma: PrismaService,
  userId: string,
  extra: Record<string, unknown> = {},
) {
  const exercise = await prisma.exercise.findFirst({
    where: { slug: R1_SLUG, isPublished: true },
    orderBy: { version: 'desc' },
  });
  if (!exercise) {
    throw new Error(`missing ${R1_SLUG}`);
  }
  const attempt = await prisma.attempt.create({
    data: {
      userId,
      exerciseId: exercise.id,
      exerciseVersion: exercise.version,
      status: 'submitted',
    },
  });
  const submission = await prisma.submission.create({
    data: {
      attemptId: attempt.id,
      payload: {},
      payloadHash: `hash-${attempt.id}`,
    },
  });
  const run = await prisma.run.create({
    data: {
      submissionId: submission.id,
      workerVersion: 'test',
      modelVersions: {},
      fxRate: new Prisma.Decimal(1),
      status: 'succeeded',
    },
  });
  const blobUri = await writeTraceBlob(run.id, {
    simulator: 'rag',
    k: 4,
    chunkCount: 8,
    tokensIn: 12,
    tokensOut: 3,
    payload: { chunkSize: 400 },
    queries: [
      {
        source: 'public',
        question: 'what is rag',
        retrieved: [
          { chunkId: 'c1', docId: 'd1', score: 0.91, text: 'retrieval hit' },
        ],
      },
    ],
    ...extra,
  });
  await prisma.trace.create({ data: { runId: run.id, blobUri } });
  return run.id;
}
