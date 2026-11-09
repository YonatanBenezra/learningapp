import {
  entrantSlugs,
  resolveSampledSlugs,
  sampleFromPool,
} from './contest-sample';

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

describe('entrantSlugs', () => {
  const problems = [
    { position: 1, exerciseSlug: 'easy-1' },
    { position: 2, exerciseSlug: 'med-1' },
    { position: 3, exerciseSlug: 'hard-1' },
  ];

  it('uses contest pool for fixed_pool even when entry slugs are stale', () => {
    expect(
      entrantSlugs(
        {
          samplingMode: 'fixed_pool',
          sampleSize: 3,
          problems,
        },
        { sampledSlugs: ['legacy-adv-1', 'legacy-adv-2'] },
      ),
    ).toEqual(['easy-1', 'med-1', 'hard-1']);
  });

  it('keeps per-user entry slugs', () => {
    const entrySlugs = ['med-1', 'hard-1'];
    expect(
      entrantSlugs(
        {
          samplingMode: 'per_user',
          sampleSize: 2,
          problems,
        },
        { sampledSlugs: entrySlugs },
      ),
    ).toEqual(entrySlugs);
  });
});
