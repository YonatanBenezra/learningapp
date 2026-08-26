import { hashToken, randomToken } from './token-hash';

describe('token-hash', () => {
  it('hashes a token stably and not as plaintext', () => {
    const token = randomToken();
    expect(token).toHaveLength(64);
    expect(hashToken(token)).toHaveLength(64);
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(token);
  });
});
