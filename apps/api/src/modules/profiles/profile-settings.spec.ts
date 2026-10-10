import { AccountTier } from '@prisma/client';
import { toProfileSettings } from './profile-settings';

describe('toProfileSettings', () => {
  it('publishes when opted in and a slug is set', () => {
    expect(
      toProfileSettings(
        { profileSlug: 'ada', profilePublic: true },
        AccountTier.pro,
      ),
    ).toEqual({
      slug: 'ada',
      public: true,
      canPublish: true,
      published: true,
      urlPath: '/u/ada',
    });
  });

  it('lets Free accounts publish with a slug', () => {
    expect(
      toProfileSettings(
        { profileSlug: 'ada', profilePublic: true },
        AccountTier.free,
      ),
    ).toMatchObject({
      canPublish: true,
      published: true,
      urlPath: '/u/ada',
    });
  });

  it('is unpublished when the user disables sharing', () => {
    expect(
      toProfileSettings(
        { profileSlug: 'ada', profilePublic: false },
        AccountTier.pro,
      ).published,
    ).toBe(false);
  });
});
