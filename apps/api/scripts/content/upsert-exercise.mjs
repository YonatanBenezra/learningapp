import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { sharedCorpusUri } from './paths.mjs';

export function fileUri(dir, name) {
  return `file:${path.join(dir, name)}`;
}

export async function readJson(dir, name) {
  return JSON.parse(await readFile(path.join(dir, name), 'utf8'));
}

export async function upsertExercise(prisma, dir) {
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
      isPublished: meta.isPublished !== false,
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
      isPublished: meta.isPublished !== false,
    },
  });

  await prisma.exerciseSkill.deleteMany({ where: { exerciseId: exercise.id } });
  await prisma.exerciseSkill.createMany({
    data: skills.map((skill) => ({
      exerciseId: exercise.id,
      skillId: skill.id,
    })),
  });

  await prisma.exercise.updateMany({
    where: { slug: meta.slug, version: { lt: meta.version } },
    data: { isPublished: false },
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

  return meta;
}
