import { HIDDEN_EVAL_CANARY } from '../../catalogue/exercises/exercises.constants';
import { ONBOARDING_STARTER, elapsedMs } from './onboarding';

describe('onboarding starter', () => {
  it('is a public R1 config with no hidden eval text', () => {
    expect(ONBOARDING_STARTER).toEqual({
      chunkSize: 400,
      overlap: 80,
      splitStrategy: 'heading-aware',
    });
    expect(JSON.stringify(ONBOARDING_STARTER)).not.toContain('HIDDEN_EVAL');
    expect(JSON.stringify(ONBOARDING_STARTER)).not.toContain(HIDDEN_EVAL_CANARY);
  });

  it('measures elapsed milliseconds from signup', () => {
    const created = new Date('2026-08-31T00:00:00.000Z');
    expect(elapsedMs(created, new Date('2026-08-31T00:02:30.000Z'))).toBe(150_000);
  });
});
