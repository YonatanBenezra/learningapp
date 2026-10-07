import { readFileSync } from 'node:fs';
import path from 'node:path';
import { loadPublishedSlugs } from '../../../content/content-paths';
import {
  isRagR1Slug,
  isRagR2Slug,
  isRagR3Slug,
  isRagR4Slug,
  isSandboxRagSlug,
} from './exercises.constants';

type GraderArchetype =
  | 'rag-r1'
  | 'rag-r2'
  | 'rag-r3'
  | 'rag-r4'
  | 'rag-sandbox';

function harnessArchetype(slug: string): GraderArchetype | 'unknown' {
  if (isSandboxRagSlug(slug)) {
    return 'rag-sandbox';
  }
  if (isRagR1Slug(slug)) {
    return 'rag-r1';
  }
  if (isRagR2Slug(slug)) {
    return 'rag-r2';
  }
  if (isRagR3Slug(slug)) {
    return 'rag-r3';
  }
  if (isRagR4Slug(slug)) {
    return 'rag-r4';
  }
  return 'unknown';
}

function metaArchetype(slug: string): GraderArchetype {
  const metaPath = path.join(
    process.cwd(),
    'content/exercises',
    slug,
    'meta.json',
  );
  const meta = JSON.parse(readFileSync(metaPath, 'utf8')) as {
    graderArchetype: GraderArchetype;
  };
  return meta.graderArchetype;
}

describe('RAG slug archetype routing (production harness + lab)', () => {
  const ragSlugs = loadPublishedSlugs().filter((slug) => slug.startsWith('rag-'));

  it('matches meta.graderArchetype for every published RAG exercise', () => {
    for (const slug of ragSlugs) {
      expect(harnessArchetype(slug)).toBe(metaArchetype(slug));
    }
  });

  it('routes rag-003-retrieval-top-k as R2, not R3', () => {
    expect(isRagR2Slug('rag-003-retrieval-top-k')).toBe(true);
    expect(isRagR3Slug('rag-003-retrieval-top-k')).toBe(false);
    expect(harnessArchetype('rag-003-retrieval-top-k')).toBe('rag-r2');
  });
});
