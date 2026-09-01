import { createRequire } from 'node:module';
import { listExerciseDirs } from './validate.mjs';
import { upsertExercise } from './upsert-exercise.mjs';
import { upsertAllPaths } from './upsert-paths.mjs';
import { upsertAllContests } from './upsert-contests.mjs';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

export async function upsertAllExercises(filterSlugs = null) {
  const prisma = new PrismaClient();
  const dirs = await listExerciseDirs();
  const selected =
    filterSlugs && filterSlugs.length > 0
      ? dirs.filter((dir) => filterSlugs.includes(dir.split(/[/\\]/).pop()))
      : dirs;

  const seeded = [];
  try {
    for (const dir of selected) {
      const meta = await upsertExercise(prisma, dir);
      seeded.push(`${meta.slug} v${meta.version}`);
    }
    if (!filterSlugs || filterSlugs.length === 0) {
      const paths = await upsertAllPaths(prisma);
      for (const slug of paths) {
        seeded.push(`path:${slug}`);
      }
      const contests = await upsertAllContests(prisma);
      for (const slug of contests) {
        seeded.push(`contest:${slug}`);
      }
    }
    return seeded;
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  upsertAllExercises()
    .then((seeded) => {
      for (const slug of seeded) {
        console.log(`Ingested ${slug}`);
      }
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
