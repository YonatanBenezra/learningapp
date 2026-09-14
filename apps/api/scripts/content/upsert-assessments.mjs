import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { contentRoot } from './paths.mjs';

const assessmentsRoot = path.join(contentRoot, 'assessments');

function assessmentSeasonKey(date) {
  const year = date.getUTCFullYear();
  const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
  return `${year}-Q${quarter}`;
}

export async function upsertAllAssessments(prisma) {
  let entries;
  try {
    entries = await readdir(assessmentsRoot, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(assessmentsRoot, entry.name))
    .sort();

  const seeded = [];
  for (const file of files) {
    const spec = JSON.parse(await readFile(file, 'utf8'));
    if (
      !spec.slug ||
      !spec.title ||
      !spec.intent ||
      !spec.startsAt ||
      !spec.endsAt ||
      !Array.isArray(spec.pool)
    ) {
      throw new Error(`Invalid assessment file: ${file}`);
    }
    if (spec.pool.length < 4) {
      throw new Error(`Assessment ${spec.slug} pool must have at least 4 items`);
    }

    for (const slug of spec.pool) {
      const exercise = await prisma.exercise.findFirst({
        where: { slug },
      });
      if (!exercise) {
        throw new Error(`Assessment ${spec.slug} references missing slug ${slug}`);
      }
    }

    const startsAt = new Date(spec.startsAt);
    const seasonKey =
      spec.seasonKey ?? assessmentSeasonKey(startsAt);
    const timeBoxMinutes = spec.timeBoxMinutes ?? 90;
    const sampleSize = spec.sampleSize ?? 4;

    await prisma.contest.upsert({
      where: { slug: spec.slug },
      create: {
        slug: spec.slug,
        title: spec.title,
        intent: spec.intent,
        kind: 'assessment',
        seasonKey,
        startsAt,
        endsAt: new Date(spec.endsAt),
        timeBoxMinutes,
        sampleSize,
        isPublished: spec.isPublished !== false,
        problems: {
          create: spec.pool.map((exerciseSlug, index) => ({
            position: index + 1,
            exerciseSlug,
          })),
        },
      },
      update: {
        title: spec.title,
        intent: spec.intent,
        kind: 'assessment',
        seasonKey,
        startsAt,
        endsAt: new Date(spec.endsAt),
        timeBoxMinutes,
        sampleSize,
        isPublished: spec.isPublished !== false,
        problems: {
          deleteMany: {},
          create: spec.pool.map((exerciseSlug, index) => ({
            position: index + 1,
            exerciseSlug,
          })),
        },
      },
    });
    seeded.push(spec.slug);
  }
  return seeded;
}
