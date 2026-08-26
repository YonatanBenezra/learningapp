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
});
