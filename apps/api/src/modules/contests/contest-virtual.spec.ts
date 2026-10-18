import { resolveVirtualSampledSlugs } from './contest-virtual';

describe('contest-virtual', () => {
  const contest = {
    id: '00000000-0000-4000-8000-000000000001',
    sampleSize: 3,
    samplingMode: 'fixed_pool' as const,
  };
  const pool = ['a', 'b', 'c', 'd'];

  it('returns stable slugs per user', () => {
    const first = resolveVirtualSampledSlugs(contest, pool, 'user-1');
    const second = resolveVirtualSampledSlugs(contest, pool, 'user-1');
    expect(first).toEqual(['a', 'b', 'c']);
    expect(second).toEqual(first);
  });

  it('can differ across users in per_user mode', () => {
    const perUser = {
      ...contest,
      samplingMode: 'per_user' as const,
      sampleSize: 2,
    };
    const a = resolveVirtualSampledSlugs(perUser, pool, 'user-a');
    const b = resolveVirtualSampledSlugs(perUser, pool, 'user-b');
    expect(a).toHaveLength(2);
    expect(b).toHaveLength(2);
  });
});
