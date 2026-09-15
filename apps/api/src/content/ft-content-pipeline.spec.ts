import path from 'node:path';
import { FINE_TUNING_SLUGS } from '../modules/catalogue/exercises/exercises.constants';
import { loadExerciseBundle } from './content-loader';
import { runContentGrader } from './content-grader-runner';

const ARCHETYPE_BY_SLUG: Record<string, string> = {
  'ft-001-tune-or-prompt': 'ft-f1',
  'ft-002-prep-the-dataset': 'ft-f2',
  'ft-003-judge-the-tuned-model': 'ft-f3',
  'ft-004-pick-the-adapter': 'ft-f4',
  'ft-005-spot-the-duplicates': 'ft-f5',
};

describe('fine-tuning content pipeline', () => {
  it.each(FINE_TUNING_SLUGS)(
    'runs reference pass and near-miss fail for %s',
    async (slug) => {
      const bundle = await loadExerciseBundle(
        path.join(process.cwd(), 'content/exercises', slug),
      );
      expect(bundle.meta.graderArchetype).toBe(ARCHETYPE_BY_SLUG[slug]);
      expect(bundle.meta.simulator).toBe('fine_tuning');

      const passed = await runContentGrader(bundle, bundle.reference);
      expect(passed.verdict).toBe('pass');
      expect(JSON.stringify(passed)).not.toContain('HIDDEN_EVAL');

      const missed = await runContentGrader(bundle, bundle.nearMiss);
      expect(missed.verdict).toBe('fail');
      expect(JSON.stringify(missed)).not.toContain('HIDDEN_EVAL');
    },
  );
});
