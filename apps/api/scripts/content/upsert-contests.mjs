import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { contentRoot } from './paths.mjs';

const contestsRoot = path.join(contentRoot, 'contests');

export async function upsertAllContests(prisma) {
  const entries = await readdir(contestsRoot, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(contestsRoot, entry.name))
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
      throw new Error(`Invalid contest file: ${file}`);
    }
    if (spec.pool.length === 0) {
      throw new Error(`Contest ${spec.slug} has no pool`);
    }

    for (const slug of spec.pool) {
      const exercise = await prisma.exercise.findFirst({
        where: { slug },
      });
      if (!exercise) {
        throw new Error(`Contest ${spec.slug} references missing slug ${slug}`);
      }
    }

    await prisma.contest.upsert({
      where: { slug: spec.slug },
      create: {
        slug: spec.slug,
        title: spec.title,
        intent: spec.intent,
        startsAt: new Date(spec.startsAt),
        endsAt: new Date(spec.endsAt),
        timeBoxMinutes: spec.timeBoxMinutes ?? 90,
        sampleSize: spec.sampleSize ?? 2,
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
        startsAt: new Date(spec.startsAt),
        endsAt: new Date(spec.endsAt),
        timeBoxMinutes: spec.timeBoxMinutes ?? 90,
        sampleSize: spec.sampleSize ?? 2,
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
