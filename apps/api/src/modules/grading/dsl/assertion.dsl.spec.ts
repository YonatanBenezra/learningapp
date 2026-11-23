import { AssertionDsl } from './assertion.dsl';

describe('AssertionDsl', () => {
  const dsl = new AssertionDsl();
  const suite = dsl.parse(`
version: 1
assertions:
  - id: no-ssn
    check: not_matches
    pattern: '\\d{3}-\\d{2}-\\d{4}'
    flavor: re2
  - id: ticket
    check: matches
    pattern: 'TCK-\\d{4}'
    flavor: re2
  - id: refund
    check: numeric_extract_compare
    pattern: 'refund of \\$([0-9.]+)'
    op: lte
    value: 500
verdict:
  fail_if: any
`);

  it('flags a bad output and passes a clean one', () => {
    const bad = dsl.evaluate(
      suite,
      'SSN 111-22-3333 is on file. No ticket. A refund of $900.',
    );
    expect(bad.flagged).toBe(true);
    const good = dsl.evaluate(
      suite,
      'Ticket TCK-1042 is resolved. A refund of $40 will land tomorrow.',
    );
    expect(good.flagged).toBe(false);
  });

  it('rejects backreferences', () => {
    expect(() =>
      dsl.parse(`
version: 1
assertions:
  - id: evil
    check: matches
    pattern: '(a+)\\1'
    flavor: re2
verdict:
  fail_if: any
`),
    ).toThrow(/backreferences|lookaround/);
  });

  it('reads normalize and action, and needs a context for classifier and judge', () => {
    const guard = dsl.parse(
      'version: 1\nnormalize: [decode_hex]\naction: redact\nassertions:\n  - id: c\n    check: classifier\n    max: 0.7\n  - id: j\n    check: judge\n',
    );
    expect(guard.normalize).toEqual(['decode_hex']);
    expect(guard.action).toBe('redact');
    expect(() => dsl.evaluate(guard, 'x')).toThrow(/guardrail filters/);
    const result = dsl.evaluate(guard, 'x', {
      classifier: () => 0.8,
      judge: () => false,
    });
    expect(result.failedIds).toEqual(['c']);
    expect(() => dsl.parse('version: 1\nnormalize: [rot13]\n')).toThrow(
      /normalize/,
    );
    expect(() => dsl.parse('version: 1\naction: shout\n')).toThrow(/action/);
  });

  it('checks links against allowed domains and sends a classifier band to the judge', () => {
    const links = dsl.parse(
      'version: 1\nassertions:\n  - id: l\n    check: urls_allowed\n    values: [hotel.test]\n',
    );
    expect(
      dsl.evaluate(links, 'See https://maps.hotel.test/a.png').flagged,
    ).toBe(false);
    expect(
      dsl.evaluate(links, '![](https://hotel-images.test/p.png)').flagged,
    ).toBe(true);
    const band = dsl.parse(
      'version: 1\nassertions:\n  - id: c\n    check: classifier\n    max: 0.5\n    judge_from: 0.1\n',
    );
    let judged = 0;
    const context = (score: number, unsafe: boolean) => ({
      classifier: () => score,
      judge: () => {
        judged += 1;
        return unsafe;
      },
    });
    expect(dsl.evaluate(band, 'x', context(0.05, true)).flagged).toBe(false);
    expect(dsl.evaluate(band, 'x', context(0.9, false)).flagged).toBe(true);
    expect(dsl.evaluate(band, 'x', context(0.3, true)).flagged).toBe(true);
    expect(dsl.evaluate(band, 'x', context(0.3, false)).flagged).toBe(false);
    expect(judged).toBe(2);
  });
});
