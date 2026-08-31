import {
  loadAllExerciseBundles,
} from './content-loader';
import { runContentGrader } from './content-grader-runner';
import {
  A1_SLUG,
  A2_SLUG,
  A3_SLUG,
  A4_SLUG,
  A5_SLUG,
  B1_SLUG,
  B2_SLUG,
  B3_SLUG,
  PHASE_1_CATALOGUE_TARGET,
} from '../modules/catalogue/exercises/exercises.constants';

describe('content pipeline — reference solutions', () => {
  it('runs reference pass and near-miss fail for every exercise', async () => {
    const bundles = await loadAllExerciseBundles();
    expect(bundles.length).toBeGreaterThanOrEqual(PHASE_1_CATALOGUE_TARGET);
    expect(bundles.map((bundle) => bundle.meta.slug)).toEqual(
      expect.arrayContaining([
        A1_SLUG,
        A2_SLUG,
        A3_SLUG,
        A4_SLUG,
        A5_SLUG,
        B1_SLUG,
        B2_SLUG,
        B3_SLUG,
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
