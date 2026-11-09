import { arenaCategoryForExercise } from './contest-arena-category';

describe('arenaCategoryForExercise', () => {
  it('maps rag simulator to retrieval', () => {
    expect(arenaCategoryForExercise('rag-026-adv-chunk-balance', 'rag')).toBe(
      'retrieval',
    );
  });

  it('maps guardrails slug heuristics', () => {
    expect(
      arenaCategoryForExercise('grd-017-adv-indirect-payload', 'guardrails'),
    ).toBe('prompt-injection');
    expect(arenaCategoryForExercise('grd-019-adv-hex-extract', 'guardrails')).toBe(
      'exfiltration',
    );
    expect(arenaCategoryForExercise('grd-022-adv-filter-stack', 'guardrails')).toBe(
      'guardrails',
    );
  });
});
