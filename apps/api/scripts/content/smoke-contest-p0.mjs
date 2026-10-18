#!/usr/bin/env node
/**
 * Phase 0 — LeetCode-style contest readiness (content + optional DB).
 * Usage: npm run content:smoke-contest-p0 -w @labpath/api
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { contentRoot } from './paths.mjs';
import { validateCore15Collection } from './validate-core-15.mjs';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

const CONTEST_SLUG = 'weekly-advanced-1';
const CONTEST_FILE = path.join(contentRoot, 'contests', `${CONTEST_SLUG}.json`);

function contestWindow(startsAt, endsAt, now = new Date()) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (now < start) return 'upcoming';
  if (now > end) return 'closed';
  return 'open';
}

async function assertContestJson() {
  const spec = JSON.parse(await readFile(CONTEST_FILE, 'utf8'));
  const errors = [];

  if (spec.slug !== CONTEST_SLUG) {
    errors.push(`slug must be ${CONTEST_SLUG}`);
  }
  if (spec.isPublished !== true) {
    errors.push('isPublished must be true for Phase 0');
  }
  if (!Array.isArray(spec.pool) || spec.pool.length !== 15) {
    errors.push('pool must have exactly 15 slugs');
  }
  if (spec.sampleSize !== 15) {
    errors.push('sampleSize must be 15 (full fixed set)');
  }
  if (spec.samplingMode !== 'fixed_pool') {
    errors.push('samplingMode should be fixed_pool');
  }
  if (typeof spec.timeBoxMinutes !== 'number' || spec.timeBoxMinutes < 1) {
    errors.push('timeBoxMinutes must be set');
  }

  const window = contestWindow(spec.startsAt, spec.endsAt);
  console.log(`Contest window (now): ${window}`);
  console.log(`  starts: ${spec.startsAt}`);
  console.log(`  ends:   ${spec.endsAt}`);
  if (window === 'closed') {
    errors.push('contest window is already closed — update endsAt for Phase 0 smoke');
  }

  if (errors.length > 0) {
    throw new Error(`Contest JSON:\n  - ${errors.join('\n  - ')}`);
  }
  console.log(`OK  ${CONTEST_SLUG}.json`);
  return spec;
}

async function assertDb() {
  const prisma = new PrismaClient();
  try {
    const published = await prisma.contest.findMany({
      where: { kind: 'contest', isPublished: true },
      select: { slug: true, title: true, sampleSize: true, timeBoxMinutes: true },
    });
    const weekly = published.filter((row) => row.slug === CONTEST_SLUG);
    if (weekly.length !== 1) {
      throw new Error(
        `Expected exactly one published contest "${CONTEST_SLUG}", got published: ${published.map((r) => r.slug).join(', ') || '(none)'}. Run content:seed-core-15.`,
      );
    }
    const legacy = ['core-15-championship', 'iron-gate-marathon', 'dogfood-s1'];
    for (const slug of legacy) {
      const row = await prisma.contest.findUnique({ where: { slug } });
      if (row?.isPublished) {
        throw new Error(`Legacy contest still published: ${slug}. Re-run content:seed-core-15.`);
      }
    }
    console.log(`OK  DB published contest: ${weekly[0].slug} (${weekly[0].timeBoxMinutes} min)`);
    console.log(`OK  legacy contests unpublished`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('Phase 0 — contest smoke\n');

  const coreErrors = await validateCore15Collection();
  if (coreErrors.length > 0) {
    throw new Error(`core-15:\n  - ${coreErrors.join('\n  - ')}`);
  }
  console.log('OK  core-15 collection');

  await assertContestJson();

  try {
    await assertDb();
  } catch (e) {
    console.warn(`WARN  DB check skipped or failed: ${e.message}`);
    console.warn('      Run: npm run content:seed-core-15 -w @labpath/api');
    process.exitCode = 1;
    return;
  }

  console.log('\nPhase 0 smoke passed (content + DB).');
  console.log('Manual: sign in → /contests → Enter → open one problem → submit.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
