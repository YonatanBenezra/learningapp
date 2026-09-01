import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import {
  exercisesRoot,
  type ExerciseContentMeta,
  type GraderArchetype,
} from './content-paths';

export type ExerciseContentBundle = {
  dir: string;
  meta: ExerciseContentMeta;
  reference: Record<string, unknown>;
  nearMiss: Record<string, unknown>;
};

export async function listExerciseDirs(
  root = exercisesRoot,
): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(root, entry.name))
    .sort();
}

export async function loadExerciseBundle(dir: string): Promise<ExerciseContentBundle> {
  const meta = JSON.parse(
    await readFile(path.join(dir, 'meta.json'), 'utf8'),
  ) as ExerciseContentMeta;
  const reference = JSON.parse(
    await readFile(path.join(dir, 'solution', 'reference.json'), 'utf8'),
  ) as Record<string, unknown>;
  const nearMiss = JSON.parse(
    await readFile(path.join(dir, 'solution', 'near-miss.json'), 'utf8'),
  ) as Record<string, unknown>;
  return { dir, meta, reference, nearMiss };
}

export async function loadAllExerciseBundles(): Promise<ExerciseContentBundle[]> {
  const dirs = await listExerciseDirs();
  const bundles: ExerciseContentBundle[] = [];
  for (const dir of dirs) {
    const bundle = await loadExerciseBundle(dir);
    if (bundle.meta.isPublished === false) {
      continue;
    }
    bundles.push(bundle);
  }
  return bundles;
}

export function archetypeForMeta(meta: ExerciseContentMeta): GraderArchetype {
  return meta.graderArchetype;
}
