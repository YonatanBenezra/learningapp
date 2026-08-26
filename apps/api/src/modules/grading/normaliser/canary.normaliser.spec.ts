import {
  CANARY_ENCODINGS,
  detectCanary,
  encodeCanary,
} from './encodings';

const CANARY = 'OVERRIDE-BK-7742';

describe('canary encodings', () => {
  it.each([...CANARY_ENCODINGS])('round-trips %s through the detector', (encoding) => {
    const payload = encodeCanary(CANARY, encoding);
    expect(detectCanary(payload, CANARY, [encoding])).toBe(encoding);
  });

  it('does not treat hex as literal', () => {
    const hex = encodeCanary(CANARY, 'hex');
    expect(detectCanary(hex, CANARY, ['literal', 'base64', 'rot13', 'reversed'])).toBeNull();
    expect(detectCanary(hex, CANARY, ['hex'])).toBe('hex');
  });
});
