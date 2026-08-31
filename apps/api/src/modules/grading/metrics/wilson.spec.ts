import { intervalVerdict, intervalsOverlap, wilsonInterval } from './wilson';

describe('wilsonInterval', () => {
  it('passes a clear majority and fails a clear miss', () => {
    expect(intervalVerdict(wilsonInterval(40, 40), 0.9)).toBe('pass');
    expect(intervalVerdict(wilsonInterval(0, 40), 0.9)).toBe('fail');
  });

  it('returns inconclusive near the line', () => {
    expect(intervalVerdict(wilsonInterval(36, 40), 0.9)).toBe('inconclusive');
  });

  it('treats overlapping Wilson intervals as not a ranking win', () => {
    const a = wilsonInterval(28, 40);
    const b = wilsonInterval(31, 40);
    expect(a.p).toBe(0.7);
    expect(b.p).toBe(0.775);
    expect(intervalsOverlap(a, b)).toBe(true);
  });

  it('separates a large decode delta on the same n', () => {
    const greedy = wilsonInterval(34, 40);
    const sampled = wilsonInterval(16, 40);
    expect(intervalsOverlap(greedy, sampled)).toBe(false);
  });
});
