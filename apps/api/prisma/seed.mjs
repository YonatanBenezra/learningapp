import { createRequire } from 'node:module';
import { upsertAllExercises } from '../scripts/content/ingest-local.mjs';

upsertAllExercises()
  .then((seeded) => {
    for (const slug of seeded) {
      console.log(`Seeded ${slug}`);
    }
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
