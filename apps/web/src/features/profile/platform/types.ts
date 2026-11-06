export type ProfileSocial = { platform: string; url: string };

export type ProfileCertification = { name: string; issuer?: string; earnedAt?: string };

export type ProfileAchievement = { name: string; earnedAt?: string; description?: string };

export type ProfileEvent = { name: string; date?: string };

export type ProfileBadge = {
  id: string;
  name: string;
  earnedAt?: string;
  rarityPct?: number;
  category: "labs" | "academy" | "event";
};

export type XpDay = { date: string; xp: number };

export type ProfileWorkspace = {
  name: string;
  username: string;
  email: string;
  country: string;
  avatar: string | null;
  cover: string | null;
  published: boolean;
  settings: {
    slug: string | null;
    canPublish: boolean;
    urlPath: string | null;
  };
  level: number;
  xp: number;
  xpToNext: number;
  totalXp: number;
  rank: string;
  grade: 1 | 2 | 3;
  summary: string;
  xpHistory: XpDay[];
  xpGainedLastYear: number;
  weeklyAverageXp: number;
  weeksActive: number;
  streakWeeks: number;
  weeklyXp: number;
  weeklyGoal: number;
  streakSavers: number;
  personalBestWeeks: number;
  streakDays: number;
  solves: number;
  attempts: number;
  socials: ProfileSocial[];
  interests: string[];
  skills: string[];
  tools: string[];
  languages: string[];
  certifications: ProfileCertification[];
  achievements: ProfileAchievement[];
  events: ProfileEvent[];
  badges: ProfileBadge[];
  accountSettings?: {
    timezone?: string;
    city?: string;
    phone?: string;
    callingCode?: string;
    website?: string;
    isc2MemberId?: string;
    openToWork?: boolean;
    jobTitle?: string;
    yearsExperience?: string;
  };
};

export type ProfileAccountSettings = ProfileWorkspace["accountSettings"];

export type ProfileMeta = {
  summary?: string;
  country?: string;
  avatarUrl?: string;
  coverUrl?: string;
  accountSettings?: ProfileAccountSettings;
  socials?: ProfileSocial[];
  interests?: string[];
  skills?: string[];
  tools?: string[];
  languages?: string[];
  certifications?: ProfileCertification[];
  achievements?: ProfileAchievement[];
  events?: ProfileEvent[];
  badges?: ProfileBadge[];
};

export type AddItemKind =
  | "summary"
  | "socials"
  | "interests"
  | "skills"
  | "tools"
  | "languages"
  | "certifications"
  | "achievements"
  | "events";

export const FILLED_PREVIEW_WORKSPACE: ProfileWorkspace = {
  name: "Jewel Mia",
  username: "jewel1269",
  email: "jewel@example.com",
  country: "Bangladesh",
  avatar: null,
  cover: null,
  published: true,
  settings: { slug: "jewel1269", canPublish: true, urlPath: "/u/jewel1269" },
  level: 2,
  xp: 45,
  xpToNext: 150,
  totalXp: 195,
  rank: "Script Kiddie",
  grade: 2,
  summary: "RAG engineer learning guardrails and eval pipelines on LabPath.",
  xpHistory: [],
  xpGainedLastYear: 420,
  weeklyAverageXp: 12,
  weeksActive: 8,
  streakWeeks: 2,
  weeklyXp: 80,
  weeklyGoal: 200,
  streakSavers: 3,
  personalBestWeeks: 4,
  streakDays: 14,
  solves: 12,
  attempts: 48,
  socials: [{ platform: "GitHub", url: "https://github.com/labpath" }],
  interests: ["RAG", "Prompt injection", "Evals"],
  skills: ["Retrieval", "Chunking", "Guardrails"],
  tools: ["LangChain", "OpenAI API"],
  languages: ["English", "Bengali"],
  certifications: [{ name: "LabPath RAG Foundations", issuer: "LabPath" }],
  achievements: [{ name: "First blood", earnedAt: "2025-08-01" }],
  events: [{ name: "LabPath CTF Sprint", date: "2025-09-12" }],
  badges: [
    {
      id: "b1",
      name: "First Pass",
      earnedAt: "2025-07-01",
      rarityPct: 42,
      category: "labs",
    },
    {
      id: "b2",
      name: "Streak Starter",
      earnedAt: "2025-07-14",
      rarityPct: 18,
      category: "academy",
    },
  ],
};
