import path from 'node:path';
import { NEURAL_NETWORK_SLUGS } from '../modules/catalogue/exercises/exercises.constants';
import { loadExerciseBundle } from './content-loader';
import { runContentGrader } from './content-grader-runner';

describe('neural network content pipeline', () => {
  it.each(NEURAL_NETWORK_SLUGS)(
    'runs reference pass and near-miss fail for %s',
    async (slug) => {
      const bundle = await loadExerciseBundle(
        path.join(process.cwd(), 'content/exercises', slug),
      );
      expect(bundle.meta.graderArchetype).toBe('nn-n1');
      expect(bundle.meta.simulator).toBe('neural_network');

      const passed = await runContentGrader(bundle, bundle.reference);
      expect(passed.verdict).toBe('pass');
      expect(JSON.stringify(passed)).not.toContain('HIDDEN_EVAL');

      const missed = await runContentGrader(bundle, bundle.nearMiss);
      expect(missed.verdict).toBe('fail');
      expect(JSON.stringify(missed)).not.toContain('HIDDEN_EVAL');
    },
  );
});
