import { pathProgress } from './path-progress';

describe('pathProgress', () => {
  const steps = ['a', 'b', 'c'];

  it('points at the first unsolved step', () => {
    expect(pathProgress(steps, new Set())).toEqual({
      stepCount: 3,
      passedCount: 0,
      nextSlug: 'a',
      complete: false,
    });
  });

  it('skips solved steps when jumping to the next unsolved', () => {
    expect(pathProgress(steps, new Set(['a']))).toEqual({
      stepCount: 3,
      passedCount: 1,
      nextSlug: 'b',
      complete: false,
    });
  });

  it('marks the path complete when the last step is passed', () => {
    expect(pathProgress(steps, new Set(['a', 'b', 'c']))).toEqual({
      stepCount: 3,
      passedCount: 3,
      nextSlug: null,
      complete: true,
    });
  });
});
