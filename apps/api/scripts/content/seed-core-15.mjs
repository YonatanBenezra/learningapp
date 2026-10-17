#!/usr/bin/env node
/**
 * Upserts the LabPath Core 15 exercises, guided path, and championship contest into Postgres.
 * Content already lives under content/exercises/* — this syncs DB rows from meta.json.
 *
 * Usage: npm run content:seed-core-15 -w @labpath/api
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { contentRoot, exercisesRoot } from './paths.mjs';
import { upsertExercise } from './upsert-exercise.mjs';
import { upsertAllPaths } from './upsert-paths.mjs';
import { upsertAllContests } from './upsert-contests.mjs';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

const COLLECTION_FILE = path.join(contentRoot, 'collections', 'core-15.json');

async function loadCollection() {
  const raw = JSON.parse(await readFile(COLLECTION_FILE, 'utf8'));
  if (!Array.isArray(raw.problems) || raw.problems.length !== 15) {
    throw new Error('core-15.json must define exactly 15 problems');
  }
  const slugs = raw.problems.map((p) => p.slug);
  if (new Set(slugs).size !== 15) {
    throw new Error('core-15.json contains duplicate slugs');
  }
  return { meta: raw, slugs };
}

async function assertContentOnDisk(slugs) {
  for (const slug of slugs) {
    const dir = path.join(exercisesRoot, slug);
    try {
      await readFile(path.join(dir, 'meta.json'), 'utf8');
    } catch {
      throw new Error(`Missing exercise content: ${slug} (expected ${dir}/meta.json)`);
    }
  }
}

async function assertPublishedList(slugs) {
  const published = JSON.parse(
    await readFile(path.join(contentRoot, 'published-slugs.json'), 'utf8'),
  );
  const missing = slugs.filter((slug) => !published.slugs.includes(slug));
  if (missing.length > 0) {
    throw new Error(
      `Core 15 slug(s) not in published-slugs.json: ${missing.join(', ')}`,
    );
  }
}

async function main() {
  const { meta, slugs } = await loadCollection();
  await assertContentOnDisk(slugs);
  await assertPublishedList(slugs);

  const prisma = new PrismaClient();
  try {
    console.log(`Core 15 — ${meta.title} (v${meta.version})`);

    for (const row of meta.problems) {
      const dir = path.join(exercisesRoot, row.slug);
      const upserted = await upsertExercise(prisma, dir);
      const inDb = await prisma.exercise.findFirst({
        where: { slug: row.slug },
        select: { id: true, slug: true, title: true, difficulty: true, isPublished: true },
      });
      if (!inDb?.isPublished) {
        throw new Error(`Exercise ${row.slug} is not published after upsert`);
      }
      console.log(
        `  exercise ${upserted.slug} v${upserted.version} · ${inDb.difficulty} · published`,
      );
    }

    const paths = await upsertAllPaths(prisma);
    if (!paths.includes('core-15-intermediate-advanced')) {
      throw new Error('Guided path core-15-intermediate-advanced was not upserted');
    }
    console.log(`  path core-15-intermediate-advanced (${paths.length} paths synced)`);

    const contests = await upsertAllContests(prisma);
    if (!contests.includes('core-15-championship')) {
      throw new Error('Contest core-15-championship was not upserted');
    }
    console.log(`  contest core-15-championship (${contests.length} contest(s) synced)`);

    console.log('\nCore 15 seed complete.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
