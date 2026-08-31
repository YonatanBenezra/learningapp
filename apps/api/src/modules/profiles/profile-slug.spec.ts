import { BadRequestException } from '@nestjs/common';
import {
  DEFAULT_DISPLAY_NAME,
  parseProfileSlug,
  publicDisplayName,
} from './profile-slug';

describe('profile slug', () => {
  it('accepts a lowercase public URL slug', () => {
    expect(parseProfileSlug('  Ada-99 ')).toBe('ada-99');
  });

  it('rejects reserved, short, and malformed slugs', () => {
    expect(() => parseProfileSlug('me')).toThrow(BadRequestException);
    expect(() => parseProfileSlug('leaderboard')).toThrow(BadRequestException);
    expect(() => parseProfileSlug('paths')).toThrow(BadRequestException);
    expect(() => parseProfileSlug('api')).toThrow(BadRequestException);
    expect(() => parseProfileSlug('ab')).toThrow(BadRequestException);
    expect(() => parseProfileSlug('-ada')).toThrow(BadRequestException);
    expect(() => parseProfileSlug('ada-')).toThrow(BadRequestException);
    expect(() => parseProfileSlug('Ada_99')).toThrow(BadRequestException);
  });

  it('never falls back to an email for the public display name', () => {
    expect(publicDisplayName(null)).toBe(DEFAULT_DISPLAY_NAME);
    expect(publicDisplayName('  ')).toBe(DEFAULT_DISPLAY_NAME);
    expect(publicDisplayName('Ada')).toBe('Ada');
  });
});
