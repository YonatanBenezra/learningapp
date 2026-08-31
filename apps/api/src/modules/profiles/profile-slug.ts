import { BadRequestException } from '@nestjs/common';

export const PROFILE_SLUG_MAX = 32;
export const DEFAULT_DISPLAY_NAME = 'Learner';
export const RECENT_SOLVE_LIMIT = 8;

const SLUG_PATTERN = /^[a-z][a-z0-9-]{1,30}[a-z0-9]$/;

const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'auth',
  'billing',
  'catalogue',
  'exercises',
  'health',
  'internal',
  'leaderboard',
  'login',
  'logout',
  'me',
  'paths',
  'onboarding',
  'profile',
  'profiles',
  'progress',
  'runs',
  'settings',
  'u',
]);

export function normalizeProfileSlug(raw: string): string {
  return raw.trim().toLowerCase();
}

export function parseProfileSlug(raw: string): string {
  const slug = normalizeProfileSlug(raw);
  if (!SLUG_PATTERN.test(slug) || RESERVED_SLUGS.has(slug)) {
    throw new BadRequestException(
      'Use 3–32 lowercase letters, numbers, or hyphens; start and end with a letter or number.',
    );
  }
  return slug;
}

export function publicDisplayName(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : DEFAULT_DISPLAY_NAME;
}
