export type ProfileSocialLink = {
  platform: string;
  url: string;
};

export type ProfileCertification = {
  name: string;
  issuer?: string;
  earnedAt?: string;
};

export type ProfileAchievement = {
  name: string;
  earnedAt?: string;
  description?: string;
};

export type ProfileEventCertificate = {
  name: string;
  date?: string;
};

export type ProfileBadge = {
  id: string;
  name: string;
  earnedAt?: string;
  rarityPct?: number;
  category: 'labs' | 'academy' | 'event';
};

export type ProfileMeta = {
  summary?: string;
  country?: string;
  avatarUrl?: string;
  coverUrl?: string;
  socials: ProfileSocialLink[];
  interests: string[];
  skills: string[];
  tools: string[];
  languages: string[];
  certifications: ProfileCertification[];
  achievements: ProfileAchievement[];
  events: ProfileEventCertificate[];
  badges: ProfileBadge[];
};

export const EMPTY_PROFILE_META: ProfileMeta = {
  socials: [],
  interests: [],
  skills: [],
  tools: [],
  languages: [],
  certifications: [],
  achievements: [],
  events: [],
  badges: [],
};

export function parseProfileMeta(raw: unknown): ProfileMeta {
  if (!raw || typeof raw !== 'object') {
    return { ...EMPTY_PROFILE_META };
  }
  const o = raw as Record<string, unknown>;
  return {
    summary: typeof o.summary === 'string' ? o.summary : undefined,
    country: typeof o.country === 'string' ? o.country : undefined,
    avatarUrl: typeof o.avatarUrl === 'string' ? o.avatarUrl : undefined,
    coverUrl: typeof o.coverUrl === 'string' ? o.coverUrl : undefined,
    socials: Array.isArray(o.socials) ? (o.socials as ProfileSocialLink[]) : [],
    interests: Array.isArray(o.interests) ? (o.interests as string[]) : [],
    skills: Array.isArray(o.skills) ? (o.skills as string[]) : [],
    tools: Array.isArray(o.tools) ? (o.tools as string[]) : [],
    languages: Array.isArray(o.languages) ? (o.languages as string[]) : [],
    certifications: Array.isArray(o.certifications)
      ? (o.certifications as ProfileCertification[])
      : [],
    achievements: Array.isArray(o.achievements)
      ? (o.achievements as ProfileAchievement[])
      : [],
    events: Array.isArray(o.events) ? (o.events as ProfileEventCertificate[]) : [],
    badges: Array.isArray(o.badges) ? (o.badges as ProfileBadge[]) : [],
  };
}
