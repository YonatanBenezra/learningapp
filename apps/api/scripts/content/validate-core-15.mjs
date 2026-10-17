import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { contentRoot, exercisesRoot } from './paths.mjs';

const COLLECTION = path.join(contentRoot, 'collections', 'core-15.json');
const PATH_FILE = path.join(contentRoot, 'paths', 'core-15-intermediate-advanced.json');
const CONTEST_FILE = path.join(contentRoot, 'contests', 'core-15-championship.json');

/** @returns {string[]} validation errors (empty if ok) */
export async function validateCore15Collection() {
  const errors = [];
  let raw;
  try {
    raw = JSON.parse(await readFile(COLLECTION, 'utf8'));
  } catch (e) {
    return [`core-15.json: ${e.message}`];
  }

  if (!Array.isArray(raw.problems) || raw.problems.length !== 15) {
    errors.push('core-15.json must define exactly 15 problems');
    return errors;
  }

  const slugs = raw.problems.map((p) => p.slug);
  if (new Set(slugs).size !== 15) {
    errors.push('core-15.json contains duplicate slugs');
  }

  const rag = raw.problems.filter((p) => p.track === 'rag');
  const guard = raw.problems.filter((p) => p.track === 'guardrails');
  if (rag.length !== 6) errors.push(`expected 6 RAG problems, got ${rag.length}`);
  if (guard.length !== 9) errors.push(`expected 9 Guard problems, got ${guard.length}`);

  let published;
  try {
    published = JSON.parse(
      await readFile(path.join(contentRoot, 'published-slugs.json'), 'utf8'),
    );
  } catch (e) {
    errors.push(`published-slugs.json: ${e.message}`);
    published = { slugs: [] };
  }

  for (const row of raw.problems) {
    if (!published.slugs.includes(row.slug)) {
      errors.push(`${row.slug} missing from published-slugs.json`);
    }
    try {
      const meta = JSON.parse(
        await readFile(path.join(exercisesRoot, row.slug, 'meta.json'), 'utf8'),
      );
      if (meta.slug !== row.slug) {
        errors.push(`${row.slug}: meta.slug mismatch`);
      }
      if (meta.title !== row.title) {
        errors.push(`${row.slug}: title mismatch (manifest vs meta.json)`);
      }
      if (meta.difficulty !== row.difficulty) {
        errors.push(`${row.slug}: difficulty mismatch (manifest vs meta.json)`);
      }
    } catch {
      errors.push(`${row.slug}: missing meta.json under content/exercises`);
    }
  }

  for (const file of [PATH_FILE, CONTEST_FILE]) {
    try {
      await readFile(file, 'utf8');
    } catch {
      errors.push(`missing ${path.relative(contentRoot, file)}`);
    }
  }

  return errors;
}
