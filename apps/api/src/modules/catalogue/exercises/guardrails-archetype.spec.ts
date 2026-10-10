import { readFileSync } from 'node:fs';
import path from 'node:path';
import { loadPublishedSlugs } from '../../../content/content-paths';
import {
  isGuardG1Slug,
  isGuardG2Slug,
  isGuardG3Slug,
} from './exercises.constants';

type GuardGraderArchetype = 'guard-g1' | 'guard-g2' | 'guard-g3';

function workspaceVariantFromHarness(slug: string): 'g1' | 'g2' | 'g3' | null {
  if (isGuardG1Slug(slug)) {
    return 'g1';
  }
  if (isGuardG2Slug(slug)) {
    return 'g2';
  }
  if (isGuardG3Slug(slug)) {
    return 'g3';
  }
  return null;
}

function workspaceVariantFromMeta(archetype: GuardGraderArchetype): 'g1' | 'g2' | 'g3' {
  if (archetype === 'guard-g1') {
    return 'g1';
  }
  if (archetype === 'guard-g2') {
    return 'g2';
  }
  return 'g3';
}

function metaArchetype(slug: string): GuardGraderArchetype {
  const metaPath = path.join(
    process.cwd(),
    'content/exercises',
    slug,
    'meta.json',
  );
  const meta = JSON.parse(readFileSync(metaPath, 'utf8')) as {
    graderArchetype: GuardGraderArchetype;
  };
  return meta.graderArchetype;
}

describe('Guardrails slug variant routing (workspace + harness)', () => {
  const grdSlugs = loadPublishedSlugs().filter((slug) =>
    slug.startsWith('grd-'),
  );

  it('matches meta.graderArchetype for every published guardrails exercise', () => {
    for (const slug of grdSlugs) {
      const harness = workspaceVariantFromHarness(slug);
      expect(harness).not.toBeNull();
      expect(harness).toBe(workspaceVariantFromMeta(metaArchetype(slug)));
    }
  });

  it('routes grd-016-policy-window as G1 direct-chat, not G3', () => {
    expect(isGuardG1Slug('grd-016-policy-window')).toBe(true);
    expect(isGuardG3Slug('grd-016-policy-window')).toBe(false);
    expect(workspaceVariantFromHarness('grd-016-policy-window')).toBe('g1');
  });
});
