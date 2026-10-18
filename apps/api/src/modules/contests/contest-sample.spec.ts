import { resolveSampledSlugs, sampleFromPool } from './contest-sample';

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

describe('resolveSampledSlugs', () => {
  const pool = ['p1', 'p2', 'p3'];

  it('keeps catalog order for fixed_pool full sample', () => {
    expect(resolveSampledSlugs(pool, 3, 'any-seed', 'fixed_pool')).toEqual(pool);
  });

  it('shuffles when sample is smaller than pool', () => {
    const a = resolveSampledSlugs(pool, 2, 'seed-a', 'per_user');
    const b = resolveSampledSlugs(pool, 2, 'seed-a', 'per_user');
    expect(a).toEqual(b);
    expect(a).toHaveLength(2);
  });
});
