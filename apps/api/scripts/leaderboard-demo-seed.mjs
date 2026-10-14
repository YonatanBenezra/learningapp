#!/usr/bin/env node
/**
 * Seed 5 public demo learners with multi-track passes (leaderboard-visible).
 * Emails use @labpath.demo (not excluded like @labpath.test).
 *
 * Usage: npm run leaderboard:demo-seed -w @labpath/api
 */
import { Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'demo-leaderboard-2026';

/**
 * @typedef {{ slug: string; daysAgo: number }} DemoPass
 * @typedef {{ email: string; slug: string; displayName: string; passes: DemoPass[] }} DemoLearner
 */

/** @type {DemoLearner[]} */
const DEMO_LEARNERS = [
  {
    email: 'ayesha.demo@labpath.demo',
    slug: 'ayesha.r',
    displayName: 'Ayesha Rahman',
    passes: [
      { slug: 'rag-001-chunk-it-right', daysAgo: 0 },
      { slug: 'rag-005-sentence-split', daysAgo: 1 },
      { slug: 'rag-006-overlap-tune', daysAgo: 2 },
      { slug: 'rag-007-chunk-balance', daysAgo: 3 },
      { slug: 'rag-010-window-fit', daysAgo: 4 },
      { slug: 'grd-001-break-the-concierge', daysAgo: 1 },
      { slug: 'grd-004-polite-boundary', daysAgo: 2 },
      { slug: 'grd-005-encoding-trick', daysAgo: 5 },
    ],
  },
  {
    email: 'tvidal.demo@labpath.demo',
    slug: 'tvidal',
    displayName: 'Tomás Vidal',
    passes: [
      { slug: 'rag-002-the-cost-ceiling', daysAgo: 0 },
      { slug: 'rag-003-retrieval-top-k', daysAgo: 2 },
      { slug: 'rag-004-rerank-or-rethink', daysAgo: 4 },
      { slug: 'grd-002-the-indirect-payload', daysAgo: 1 },
      { slug: 'grd-007-hex-extract', daysAgo: 3 },
    ],
  },
  {
    email: 'meilin.demo@labpath.demo',
    slug: 'meilin',
    displayName: 'Mei Lin',
    passes: [
      { slug: 'rag-008-spend-cap', daysAgo: 0 },
      { slug: 'rag-009-python-retriever', daysAgo: 3 },
      { slug: 'grd-010-page-inject', daysAgo: 1 },
      { slug: 'grd-011-bcc-smuggle', daysAgo: 4 },
    ],
  },
  {
    email: 'sam.demo@labpath.demo',
    slug: 'sam.k',
    displayName: 'Sam Kim',
    passes: [
      { slug: 'rag-016-citation-lock', daysAgo: 1 },
      { slug: 'rag-017-rerank-pass', daysAgo: 4 },
      { slug: 'grd-013-filter-stack', daysAgo: 0 },
      { slug: 'grd-014-wilson-gate', daysAgo: 2 },
      { slug: 'grd-015-benign-pass', daysAgo: 5 },
    ],
  },
  {
    email: 'nora.demo@labpath.demo',
    slug: 'nora.p',
    displayName: 'Nora Patel',
    passes: [
      { slug: 'rag-021-rank-boost', daysAgo: 2 },
      { slug: 'rag-022-score-gate', daysAgo: 5 },
      { slug: 'grd-016-policy-window', daysAgo: 1 },
    ],
  },
];

async function ensurePass(userId, slug, at) {
  const exercise = await prisma.exercise.findFirst({
    where: { slug, isPublished: true },
    orderBy: { version: 'desc' },
  });
  if (!exercise) {
    throw new Error(
      `Exercise "${slug}" not found. Run: npm run content:sync-catalogue -w @labpath/api`,
    );
  }

  const existing = await prisma.grade.findFirst({
    where: {
      verdict: 'pass',
      run: {
        submission: {
          attempt: { userId, exerciseId: exercise.id },
        },
      },
    },
  });
  if (existing) {
    return { skipped: true, slug };
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
      payloadHash: `demo-${attempt.id}`,
      createdAt: at,
    },
  });
  const run = await prisma.run.create({
    data: {
      submissionId: submission.id,
      workerVersion: 'leaderboard-demo-seed',
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
      verdict: 'pass',
      metrics: {},
      gateResults: {},
      failureClasses: [],
      scorecard: {},
      failingCases: {},
      createdAt: at,
    },
  });
  return { skipped: false, slug };
}

async function upsertDemoUser(learner) {
  const passwordHash = await hash(DEMO_PASSWORD, 10);
  const now = new Date();

  let user = await prisma.user.findUnique({ where: { email: learner.email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: learner.email,
        emailVerified: now,
        displayName: learner.displayName,
        profileSlug: learner.slug,
        profilePublic: true,
        identities: {
          create: {
            provider: 'password',
            providerUserId: learner.email,
            passwordHash,
          },
        },
        account: { create: {} },
      },
    });
    console.log(`Created user ${learner.displayName} (@${learner.slug})`);
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: learner.displayName,
        profileSlug: learner.slug,
        profilePublic: true,
        deletedAt: null,
      },
    });
    const identity = await prisma.identity.findFirst({
      where: { userId: user.id, provider: 'password' },
    });
    if (!identity) {
      await prisma.identity.create({
        data: {
          userId: user.id,
          provider: 'password',
          providerUserId: learner.email,
          passwordHash,
        },
      });
    }
    await prisma.account.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });
    console.log(`Updated user ${learner.displayName} (@${learner.slug})`);
  }

  let added = 0;
  let skipped = 0;
  for (const pass of learner.passes) {
    const passedAt = new Date(now.getTime() - pass.daysAgo * 24 * 60 * 60 * 1000);
    const result = await ensurePass(user.id, pass.slug, passedAt);
    if (result.skipped) {
      skipped += 1;
    } else {
      added += 1;
      console.log(`  + pass ${result.slug} (${passedAt.toISOString().slice(0, 10)})`);
    }
  }
  console.log(`  ${added} new pass(es), ${skipped} already on file`);

  return user;
}

async function main() {
  for (const learner of DEMO_LEARNERS) {
    await upsertDemoUser(learner);
  }

  const board = await prisma.user.findMany({
    where: {
      email: { in: DEMO_LEARNERS.map((l) => l.email) },
      profilePublic: true,
      profileSlug: { not: null },
    },
    select: { profileSlug: true, displayName: true },
  });

  console.log('\nDemo learners on the board:', board.length);
  for (const row of board) {
    console.log(`  - ${row.displayName} (@${row.profileSlug})`);
  }
  console.log(`\nLogin password (all demo accounts): ${DEMO_PASSWORD}`);
  console.log('Refresh /leaderboard — Tracks column shows RAG (orange) + Guard (teal) pills.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
