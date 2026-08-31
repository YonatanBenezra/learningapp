import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { exercisesRoot } from './paths.mjs';
import { readJson } from './upsert-exercise.mjs';
import { validateMeta } from './validate-meta.mjs';

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function listExerciseDirs(root = exercisesRoot) {
  const entries = await readdir(root, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(root, entry.name))
    .sort();
}

export async function validateExerciseDir(dir) {
  const errors = [];
  const requiredFiles = [
    'meta.json',
    'eval_public.json',
    'eval_hidden.json',
    path.join('solution', 'reference.json'),
    path.join('solution', 'near-miss.json'),
  ];

  for (const file of requiredFiles) {
    if (!(await exists(path.join(dir, file)))) {
      errors.push(`missing ${file}`);
    }
  }

  if (errors.length > 0) {
    return errors;
  }

  const meta = await readJson(dir, 'meta.json');
  errors.push(...validateMeta(meta, dir));

  const reference = JSON.parse(
    await readFile(path.join(dir, 'solution', 'reference.json'), 'utf8'),
  );
  const nearMiss = JSON.parse(
    await readFile(path.join(dir, 'solution', 'near-miss.json'), 'utf8'),
  );
  if (!reference || typeof reference !== 'object' || Array.isArray(reference)) {
    errors.push('solution/reference.json must be an object');
  }
  if (!nearMiss || typeof nearMiss !== 'object' || Array.isArray(nearMiss)) {
    errors.push('solution/near-miss.json must be an object');
  }

  const publicRaw = await readFile(path.join(dir, 'eval_public.json'), 'utf8');
  if (publicRaw.includes('HIDDEN_EVAL')) {
    errors.push('eval_public.json leaks a HIDDEN_EVAL canary');
  }
  const hiddenRaw = await readFile(path.join(dir, 'eval_hidden.json'), 'utf8');
  if (!hiddenRaw.includes('HIDDEN_EVAL')) {
    errors.push('eval_hidden.json is missing a HIDDEN_EVAL canary');
  }

  return errors;
}

export async function validateAllExercises(root = exercisesRoot) {
  const dirs = await listExerciseDirs(root);
  const report = [];
  for (const dir of dirs) {
    const errors = await validateExerciseDir(dir);
    report.push({
      slug: path.basename(dir),
      errors,
    });
  }
  return report;
}
