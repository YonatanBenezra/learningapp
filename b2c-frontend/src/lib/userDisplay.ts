import type { User } from '@/src/domain/user';

export type UserDisplaySource = Pick<User, 'name' | 'email' | 'imageUrl'> | null | undefined;

export interface UserDisplayNameOptions {
  fallback?: string;
  /** Short navbar-style label when falling back to email username */
  compact?: boolean;
}

function usernameFromEmail(email: string, compact: boolean): string {
  const local = email.split('@')[0] ?? email;
  if (!compact) return local;

  const word = local.split(/[._-]/)[0] ?? local;
  const capitalized = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  const maxLen = 10;
  return capitalized.length <= maxLen ? capitalized : `${capitalized.slice(0, maxLen)}…`;
}

/** Display name: saved `name` when set, otherwise email local-part (username). */
export function getUserDisplayName(
  user: UserDisplaySource,
  options: UserDisplayNameOptions = {},
): string {
  const { fallback = 'User', compact = false } = options;
  if (!user) return fallback;

  const trimmedName = user.name?.trim();
  if (trimmedName) return trimmedName;

  const email = user.email?.trim();
  if (!email) return fallback;

  return usernameFromEmail(email, compact);
}

export function getUserAvatarProps(user: UserDisplaySource) {
  return {
    name: getUserDisplayName(user),
    src: user?.imageUrl?.trim() || undefined,
  };
}
