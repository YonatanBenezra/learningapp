import {
  loadAllExerciseBundles,
} from './content-loader';
import { runContentGrader } from './content-grader-runner';
import { loadPublishedSlugs } from './content-paths';
import {
  POC_CATALOGUE_TARGET,
  R1_SLUG,
  R2_SLUG,
  R3_SLUG,
  R4_SLUG,
  SANDBOX_SLUG,
} from '../modules/catalogue/exercises/exercises.constants';

describe('content pipeline — reference solutions', () => {
  it('runs reference pass and near-miss fail for every published exercise', async () => {
    const published = loadPublishedSlugs();
    expect(published).toHaveLength(POC_CATALOGUE_TARGET);

    const bundles = await loadAllExerciseBundles();
    expect(bundles.map((bundle) => bundle.meta.slug).sort()).toEqual(
      [...published].sort(),
    );

    if (published.length === 0) {
      return;
    }

    expect(bundles.map((bundle) => bundle.meta.slug)).toEqual(
      expect.arrayContaining([
        R1_SLUG,
        R2_SLUG,
        R3_SLUG,
        R4_SLUG,
        SANDBOX_SLUG,
      ]),
    );

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
