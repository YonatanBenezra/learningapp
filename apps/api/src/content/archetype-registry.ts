import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { exercisesRoot } from './content-paths';

/**
 * slug -> meta.graderArchetype, read once from content/exercises/*\/meta.json.
 * Content is the source of truth for which grader runs; the API and worker
 * already read eval and corpus assets from the same directory, so no database
 * column is needed. Slug-number rules stay only as a fallback.
 */
let registry: Map<string, string> | null = null;

function loadRegistry(root: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!existsSync(root)) {
    return map;
  }
  for (const dir of readdirSync(root)) {
    const metaPath = path.join(root, dir, 'meta.json');
    if (!existsSync(metaPath)) {
      continue;
    }
    try {
      const meta = JSON.parse(readFileSync(metaPath, 'utf8')) as {
        slug?: unknown;
        graderArchetype?: unknown;
      };
      if (
        typeof meta.slug === 'string' &&
        typeof meta.graderArchetype === 'string'
      ) {
        map.set(meta.slug, meta.graderArchetype);
      }
    } catch {
      // A broken meta.json is reported by content:validate; skip it here.
    }
  }
  return map;
}

/** The grader archetype declared in the exercise's meta.json, if any. */
export function graderArchetypeOf(slug: string): string | null {
  registry ??= loadRegistry(exercisesRoot);
  return registry.get(slug) ?? null;
}

/** Tests only: reload from a given content root. */
export function resetArchetypeRegistry(root: string = exercisesRoot): void {
  registry = loadRegistry(root);
}
