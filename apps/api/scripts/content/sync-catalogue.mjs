import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { upsertExercise } from './upsert-exercise.mjs';
import { contentRoot, exercisesRoot } from './paths.mjs';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

function loadPublishedSlugs() {
  const raw = JSON.parse(
    readFileSync(path.join(contentRoot, 'published-slugs.json'), 'utf8'),
  );
  if (!Array.isArray(raw.slugs)) {
    throw new Error('published-slugs.json must contain a slugs array');
  }
  return raw.slugs;
}

async function syncCatalogue() {
  const published = loadPublishedSlugs();
  const prisma = new PrismaClient();
  try {
    for (const slug of published) {
      const dir = path.join(exercisesRoot, slug);
      await upsertExercise(prisma, dir);
      console.log(`Published ${slug}`);
    }
    const cleared = await prisma.exercise.updateMany({
      where: { slug: { notIn: published } },
      data: { isPublished: false },
    });
    console.log(
      `Catalogue sync done — ${published.length} live slug(s); ${cleared.count} row(s) marked unpublished.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

syncCatalogue().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
