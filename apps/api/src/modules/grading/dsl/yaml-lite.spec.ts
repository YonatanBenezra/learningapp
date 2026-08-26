import { parseSimpleYaml } from './yaml-lite';

describe('parseSimpleYaml', () => {
  it('parses the Assertion DSL example', () => {
    const doc = parseSimpleYaml(`
version: 1
assertions:
  - id: no-pii
    when: always
    check: not_matches
    pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b'
    flavor: re2
  - id: length
    check: length_between
    min: 20
    max: 1200
verdict:
  fail_if: any
`);
    expect(doc).toMatchObject({
      version: 1,
      assertions: [
        { id: 'no-pii', check: 'not_matches', flavor: 're2' },
        { id: 'length', check: 'length_between', min: 20, max: 1200 },
      ],
      verdict: { fail_if: 'any' },
    });
  });

  it('parses flow-style empty lists', () => {
    const doc = parseSimpleYaml('version: 1\nassertions: []\n');
    expect(doc).toEqual({ version: 1, assertions: [] });
  });
});
