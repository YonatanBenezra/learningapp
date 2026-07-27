import { env } from '../../config/env';
import { User } from '../users/user.model';

const cache = new Map<string, { model: string; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

/** User preference → platform default (OPENROUTER_MODEL). */
export async function resolveUserAiModel(userId: string | null | undefined): Promise<string> {
  if (!userId) return env.openRouterModel;

  const cached = cache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.model;

  const user = await User.findById(userId).select('preferences.aiModel').lean();
  const preferred =
    user && typeof user.preferences === 'object' && user.preferences !== null
      ? (user.preferences as { aiModel?: string }).aiModel?.trim()
      : undefined;

  const model = preferred || env.openRouterModel;
  cache.set(userId, { model, expiresAt: Date.now() + CACHE_TTL_MS });
  return model;
}

export function invalidateUserAiModelCache(userId: string): void {
  cache.delete(userId);
}
