import { parseRedisUrl } from './redis-url';

describe('parseRedisUrl', () => {
  it('parses local redis without tls', () => {
    expect(parseRedisUrl('redis://localhost:6382')).toEqual({
      host: 'localhost',
      port: 6382,
      username: undefined,
      password: undefined,
      tls: undefined,
    });
  });

  it('parses upstash-style rediss with auth', () => {
    expect(
      parseRedisUrl('rediss://default:secret@example.upstash.io:6379'),
    ).toEqual({
      host: 'example.upstash.io',
      port: 6379,
      username: 'default',
      password: 'secret',
      tls: {},
    });
  });
});
