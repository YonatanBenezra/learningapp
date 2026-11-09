export type PlatformUpdateKind = "new" | "improved";

export type PlatformUpdate = {
  id: string;
  kind: PlatformUpdateKind;
  title: string;
  body: string;
};

/** In-app release notes — populate when shipping; no mock entries. */
export const platformUpdates: PlatformUpdate[] = [];

export const LABPATH_CHANGELOG_URL = "https://github.com/Bina-Labs/Labpath/releases";
export const LABPATH_CHANGELOG_RSS_URL = "https://github.com/Bina-Labs/Labpath/releases.atom";
