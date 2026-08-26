import { ttlToMs } from './ttl';

describe('ttlToMs', () => {
  it('parses the JWT TTL forms we use in env', () => {
    expect(ttlToMs('15m')).toBe(15 * 60_000);
    expect(ttlToMs('7d')).toBe(7 * 86_400_000);
  });
});
