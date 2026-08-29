import {
  loadAllExerciseBundles,
} from './content-loader';
import { runContentGrader } from './content-grader-runner';

describe('content pipeline — reference solutions', () => {
  it('runs reference pass and near-miss fail for every exercise', async () => {
    const bundles = await loadAllExerciseBundles();
    expect(bundles.length).toBeGreaterThanOrEqual(26);

    for (const bundle of bundles) {
      const passed = await runContentGrader(bundle, bundle.reference);
      expect(passed.verdict).toBe('pass');
      expect(JSON.stringify(passed)).not.toContain('HIDDEN_EVAL');

      const missed = await runContentGrader(bundle, bundle.nearMiss);
      expect(missed.verdict).toBe('fail');
      expect(JSON.stringify(missed)).not.toContain('HIDDEN_EVAL');
    }
  }, 180_000);
});
