import { intervalVerdict, wilsonInterval } from './wilson';

describe('wilsonInterval', () => {
  it('passes a clear majority and fails a clear miss', () => {
    expect(intervalVerdict(wilsonInterval(40, 40), 0.9)).toBe('pass');
    expect(intervalVerdict(wilsonInterval(0, 40), 0.9)).toBe('fail');
  });

  it('returns inconclusive near the line', () => {
    expect(intervalVerdict(wilsonInterval(36, 40), 0.9)).toBe('inconclusive');
  });
});
