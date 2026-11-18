import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const contentRoot = path.join(process.cwd(), 'content');
export const exercisesRoot = path.join(contentRoot, 'exercises');
export const publishedSlugsPath = path.join(
  contentRoot,
  'published-slugs.json',
);

/**
 * The corpus an exercise grades against: "shared" (the internal policy
 * corpus), the name of a corpus in content/corpora/ (e.g. "support-kb"), or
 * the exercise's own corpus.json. Mirrors scripts/content/paths.mjs.
 */
export function corpusPathFor(
  dir: string,
  meta: { corpusFile?: string },
): string {
  if (meta.corpusFile === 'shared') {
    return path.join(contentRoot, 'corpora', 'internal-policy.json');
  }
  if (meta.corpusFile) {
    const named = path.join(contentRoot, 'corpora', `${meta.corpusFile}.json`);
    if (existsSync(named)) {
      return named;
    }
  }
  return path.join(dir, 'corpus.json');
}

export function loadPublishedSlugs(): string[] {
  const raw = JSON.parse(readFileSync(publishedSlugsPath, 'utf8')) as {
    slugs: string[];
  };
  return raw.slugs;
}

export type GraderArchetype =
  | 'rag-r1'
  | 'rag-r2'
  | 'rag-r3'
  | 'rag-r4'
  | 'rag-sandbox'
  | 'rag-r5'
  | 'rag-redteam'
  | 'pe-p1'
  | 'agent-a1'
  | 'agent-a2'
  | 'agent-a3'
  | 'agent-a4'
  | 'bench-b1'
  | 'bench-b2'
  | 'bench-b3'
  | 'eval-e1'
  | 'eval-e2'
  | 'eval-e3'
  | 'guard-g1'
  | 'guard-g2'
  | 'guard-g3'
  | 'nn-n1'
  | 'ft-f1'
  | 'ft-f2'
  | 'ft-f3'
  | 'ft-f4'
  | 'ft-f5';

export type ExerciseContentMeta = {
  slug: string;
  version: number;
  simulator: string;
  graderArchetype: GraderArchetype;
  title: string;
  difficulty: string;
  corpusFile?: string;
  isPublished?: boolean;
  /** Declared pass gates; graders read their thresholds from these. */
  gates?: unknown;
};
