import { SliceSpecParser, evalWhere, parseWhere } from './slice-spec.parser';

describe('SliceSpecParser', () => {
  const parser = new SliceSpecParser();

  it('parses a hebrew-billing slice and evaluates meta', () => {
    const spec = parser.parse(`
version: 1
slices:
  - name: hebrew-billing
    where: "meta.language == 'he' && meta.category == 'billing'"
metric: pass_rate
test: two_proportion_z
alpha: 0.05
correction: benjamini_hochberg
min_slice_n: 20
`);
    expect(spec.correction).toBe('benjamini_hochberg');
    expect(spec.slices[0]?.name).toBe('hebrew-billing');
    expect(
      evalWhere(spec.slices[0]!.where, { language: 'he', category: 'billing' }),
    ).toBe(true);
    expect(
      evalWhere(spec.slices[0]!.where, { language: 'en', category: 'billing' }),
    ).toBe(false);
  });

  it('rejects eval and function calls in where', () => {
    expect(() => parseWhere('eval(meta.language)')).toThrow(/function|eval/);
    expect(() => parseWhere('meta.language() == "he"')).toThrow();
  });
});
