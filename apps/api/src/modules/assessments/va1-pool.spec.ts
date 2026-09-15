import path from 'node:path';
import { loadExerciseBundle, listExerciseDirs } from '../../content/content-loader';
import { loadPublishedSlugs } from '../../content/content-paths';
import { runContentGrader } from '../../content/content-grader-runner';

const VA1_POOL_MIN = 12;

async function loadVa1PoolBundles() {
  const dirs = await listExerciseDirs();
  const bundles = [];
  for (const dir of dirs) {
    const slug = path.basename(dir);
    if (!slug.startsWith('asmt-')) {
      continue;
    }
    bundles.push(await loadExerciseBundle(dir));
  }
  return bundles;
}

describe('VA1 assessment pool', () => {
  it('has at least twelve unpublished asmt-* exercises', async () => {
    const bundles = await loadVa1PoolBundles();
    expect(bundles.length).toBeGreaterThanOrEqual(VA1_POOL_MIN);
    const published = new Set(loadPublishedSlugs());
    for (const bundle of bundles) {
      expect(bundle.meta.isPublished).toBe(false);
      expect(published.has(bundle.meta.slug)).toBe(false);
    }
  });

  it('reference passes and near-miss fails for every asmt-* exercise', async () => {
    const bundles = await loadVa1PoolBundles();
    expect(bundles.length).toBeGreaterThanOrEqual(VA1_POOL_MIN);

    for (const bundle of bundles) {
      const passed = await runContentGrader(bundle, bundle.reference);
      expect(passed.verdict).toBe('pass');
      expect(JSON.stringify(passed)).not.toContain('HIDDEN_EVAL');

      const missed = await runContentGrader(bundle, bundle.nearMiss);
      expect(missed.verdict).toBe('fail');
      expect(JSON.stringify(missed)).not.toContain('HIDDEN_EVAL');
    }
  }, 300_000);
});
