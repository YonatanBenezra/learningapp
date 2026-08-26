import { createRequire } from 'node:module';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const contentRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../content',
);
const exercisesRoot = path.join(contentRoot, 'exercises');
const sharedCorpusUri = `file:${path.join(contentRoot, 'corpora', 'internal-policy.json')}`;

function fileUri(dir, name) {
  return `file:${path.join(dir, name)}`;
}

async function readJson(dir, name) {
  return JSON.parse(await readFile(path.join(dir, name), 'utf8'));
}

async function seedExercise(dir) {
  const meta = await readJson(dir, 'meta.json');
  const publicSample = await readJson(dir, 'eval_public.json');
  const corpusUri =
    meta.corpusFile === 'shared'
      ? sharedCorpusUri
      : existsSync(path.join(dir, 'corpus.json'))
        ? fileUri(dir, 'corpus.json')
        : null;

  const skills = [];
  for (const skill of meta.skills) {
    skills.push(
      await prisma.skill.upsert({
        where: { slug: skill.slug },
        create: { slug: skill.slug, name: skill.name },
        update: { name: skill.name },
      }),
    );
  }

  const exercise = await prisma.exercise.upsert({
    where: {
      slug_version: { slug: meta.slug, version: meta.version },
    },
    create: {
      slug: meta.slug,
      version: meta.version,
      type: meta.type,
      simulator: meta.simulator,
      title: meta.title,
      briefMd: meta.briefMd,
      difficulty: meta.difficulty,
      submissionSchema: meta.submissionSchema,
      thresholds: meta.thresholds,
      budget: meta.budget,
      gates: meta.gates,
      feedback: meta.feedback,
      publicSample,
      attemptPolicy: meta.attemptPolicy ?? null,
      isPublished: true,
    },
    update: {
      title: meta.title,
      briefMd: meta.briefMd,
      difficulty: meta.difficulty,
      submissionSchema: meta.submissionSchema,
      thresholds: meta.thresholds,
      budget: meta.budget,
      gates: meta.gates,
      feedback: meta.feedback,
      publicSample,
      attemptPolicy: meta.attemptPolicy ?? null,
      isPublished: true,
    },
  });

  await prisma.exerciseSkill.deleteMany({ where: { exerciseId: exercise.id } });
  await prisma.exerciseSkill.createMany({
    data: skills.map((skill) => ({
      exerciseId: exercise.id,
      skillId: skill.id,
    })),
  });

  await prisma.exerciseAsset.upsert({
    where: {
      exerciseSlug_exerciseVersion: {
        exerciseSlug: meta.slug,
        exerciseVersion: meta.version,
      },
    },
    create: {
      exerciseSlug: meta.slug,
      exerciseVersion: meta.version,
      hiddenEvalUri: fileUri(dir, 'eval_hidden.json'),
      publicEvalUri: fileUri(dir, 'eval_public.json'),
      corpusUri,
    },
    update: {
      hiddenEvalUri: fileUri(dir, 'eval_hidden.json'),
      publicEvalUri: fileUri(dir, 'eval_public.json'),
      corpusUri,
    },
  });

  console.log(`Seeded ${meta.slug} v${meta.version}`);
}

async function seed() {
  const entries = await readdir(exercisesRoot, { withFileTypes: true });
  const dirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(exercisesRoot, entry.name))
    .sort();
  for (const dir of dirs) {
    await seedExercise(dir);
  }
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
