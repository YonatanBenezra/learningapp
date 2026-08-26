import {
  G1_LEVELS,
  assertManifest,
  winnableGapEncodings,
} from './levels';

describe('G1 level manifests', () => {
  it('keeps filter_catches a subset of detector_catches', () => {
    for (const manifest of G1_LEVELS) {
      expect(() => assertManifest(manifest)).not.toThrow();
    }
  });

  it('is winnable on L3 via at least three intended-gap encodings', () => {
    const l3 = G1_LEVELS.find((row) => row.level === 3);
    expect(l3).toBeDefined();
    expect(winnableGapEncodings(l3!).length).toBeGreaterThanOrEqual(3);
  });
});
