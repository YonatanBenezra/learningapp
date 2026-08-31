import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { contentRoot } from './paths.mjs';

const pathsRoot = path.join(contentRoot, 'paths');

export async function upsertAllPaths(prisma) {
  const entries = await readdir(pathsRoot, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(pathsRoot, entry.name))
    .sort();

  const seeded = [];
  for (const file of files) {
    const spec = JSON.parse(await readFile(file, 'utf8'));
    if (!spec.slug || !spec.title || !spec.intent || !Array.isArray(spec.steps)) {
      throw new Error(`Invalid path file: ${file}`);
    }
    if (spec.steps.length === 0) {
      throw new Error(`Path ${spec.slug} has no steps`);
    }

    for (const slug of spec.steps) {
      const exercise = await prisma.exercise.findFirst({
        where: { slug, isPublished: true },
      });
      if (!exercise) {
        throw new Error(`Path ${spec.slug} references unpublished slug ${slug}`);
      }
    }

    await prisma.guidedPath.upsert({
      where: { slug: spec.slug },
      create: {
        slug: spec.slug,
        title: spec.title,
        intent: spec.intent,
        sortOrder: spec.sortOrder ?? 0,
        isPublished: true,
        steps: {
          create: spec.steps.map((exerciseSlug, index) => ({
            position: index + 1,
            exerciseSlug,
          })),
        },
      },
      update: {
        title: spec.title,
        intent: spec.intent,
        sortOrder: spec.sortOrder ?? 0,
        isPublished: true,
        steps: {
          deleteMany: {},
          create: spec.steps.map((exerciseSlug, index) => ({
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
