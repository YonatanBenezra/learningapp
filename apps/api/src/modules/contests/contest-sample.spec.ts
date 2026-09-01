import { sampleFromPool } from './contest-sample';

describe('sampleFromPool', () => {
  const pool = ['a', 'b', 'c', 'd'];

  it('is deterministic for a seed', () => {
    expect(sampleFromPool(pool, 2, 'seed-1')).toEqual(
      sampleFromPool(pool, 2, 'seed-1'),
    );
  });

  it('returns sampleSize items', () => {
    expect(sampleFromPool(pool, 2, 'seed-2')).toHaveLength(2);
  });

  it('never returns duplicates', () => {
    const sampled = sampleFromPool(pool, 3, 'seed-3');
    expect(new Set(sampled).size).toBe(3);
  });
});
