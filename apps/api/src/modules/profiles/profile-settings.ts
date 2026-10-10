import { AccountTier } from '@prisma/client';

export type ProfileSettings = {
  slug: string | null;
  public: boolean;
  canPublish: boolean;
  published: boolean;
  urlPath: string | null;
};

export function toProfileSettings(
  user: { profileSlug: string | null; profilePublic: boolean },
  _tier: AccountTier,
): ProfileSettings {
  const canPublish = true;
  const published = Boolean(user.profilePublic && user.profileSlug);
  return {
    slug: user.profileSlug,
    public: user.profilePublic,
    canPublish,
    published,
    urlPath: published && user.profileSlug ? `/u/${user.profileSlug}` : null,
  };
}
