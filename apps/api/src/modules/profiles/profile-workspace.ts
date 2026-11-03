import { RECENT_PASS_WINDOW_MS, leaderboardRating } from '../leaderboard/leaderboard-rank';
import { calendarDateKey } from '../progress/calendar';
import { computeStreak } from '../progress/streak';
import type { ProfileMeta } from './profile-meta';

const XP_PER_PASS = 100;
const XP_PER_ATTEMPT = 5;
const XP_PER_LEVEL = 150;

export function rankTitleFromRating(rating: number): string {
  if (rating >= 5000) return 'Omniscient';
  if (rating >= 3500) return 'Guru';
  if (rating >= 2500) return 'Wizard';
  if (rating >= 1500) return 'Expert';
  if (rating >= 800) return 'Pro';
  if (rating >= 400) return 'Script Kiddie';
  return 'Beginner';
}

export function gradeFromRating(rating: number): 1 | 2 | 3 {
  if (rating >= 2500) return 3;
  if (rating >= 800) return 2;
  return 1;
}

export function levelFromXp(xp: number) {
  const level = Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);
  const inLevel = xp % XP_PER_LEVEL;
  return { level, xpInLevel: inLevel, xpToNext: XP_PER_LEVEL };
}

export type XpDay = { date: string; xp: number };

export function buildXpDays(
  attemptDates: string[],
  passDates: string[],
  days = 371,
): XpDay[] {
  const xpByDate = new Map<string, number>();
  for (const iso of attemptDates) {
    const key = iso.slice(0, 10);
    xpByDate.set(key, (xpByDate.get(key) ?? 0) + XP_PER_ATTEMPT);
  }
  for (const iso of passDates) {
    const key = iso.slice(0, 10);
    xpByDate.set(key, (xpByDate.get(key) ?? 0) + XP_PER_PASS);
  }

  const result: XpDay[] = [];
  const today = new Date();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    result.push({ date: key, xp: xpByDate.get(key) ?? 0 });
  }
  return result;
}

export function xpGainedInRange(days: XpDay[]) {
  return days.reduce((sum, d) => sum + d.xp, 0);
}

export function weeksActive(days: XpDay[]) {
  const active = days.filter((d) => d.xp > 0).length;
  return Math.max(0, Math.ceil(active / 7));
}

export function weeklyAverageXp(days: XpDay[]) {
  const total = xpGainedInRange(days);
  const weekCount = Math.max(1, Math.ceil(days.length / 7));
  return Math.round(total / weekCount);
}

export function computePracticeRating(
  solves: number,
  passRows: { createdAt: Date }[],
  now = new Date(),
) {
  const recentCutoff = new Date(now.getTime() - RECENT_PASS_WINDOW_MS);
  let recentPasses = 0;
  for (const row of passRows) {
    if (row.createdAt >= recentCutoff) {
      recentPasses += 1;
    }
  }
  return { rating: leaderboardRating(solves, recentPasses), recentPasses };
}

export function mergeMetaSkills(
  meta: ProfileMeta,
  skillNames: string[],
): ProfileMeta {
  const merged = new Set([...meta.skills, ...skillNames]);
  return { ...meta, skills: [...merged].slice(0, 24) };
}

export function streakWeeksFromDays(streakDays: number) {
  return Math.floor(streakDays / 7);
}

export function buildWorkspacePayload(input: {
  email: string;
  displayName: string | null;
  profileSlug: string | null;
  profilePublic: boolean;
  imageUrl: string | null;
  meta: ProfileMeta;
  solves: number;
  attempts: number;
  rating: number;
  streakCurrent: number;
  streakLongest: number;
  xpDays: XpDay[];
  tier: string;
}) {
  const name =
    input.displayName?.trim() ||
    input.email.split('@')[0]?.replace(/[._-]+/g, ' ') ||
    'Learner';
  const username = input.profileSlug ?? input.email.split('@')[0] ?? 'learner';
  const xpTotal = input.rating;
  const level = levelFromXp(xpTotal);
  const yearXp = xpGainedInRange(input.xpDays);

  return {
    name,
    username,
    email: input.email,
    country: input.meta.country ?? '',
    avatar: input.meta.avatarUrl ?? input.imageUrl ?? null,
    cover: input.meta.coverUrl ?? null,
    published: Boolean(input.profilePublic && input.profileSlug),
    settings: {
      slug: input.profileSlug,
      canPublish: true,
      urlPath:
        input.profilePublic && input.profileSlug
          ? `/u/${input.profileSlug}`
          : null,
    },
    level: level.level,
    xp: level.xpInLevel,
    xpToNext: level.xpToNext,
    totalXp: xpTotal,
    rank: rankTitleFromRating(input.rating),
    grade: gradeFromRating(input.rating),
    summary: input.meta.summary ?? '',
    xpHistory: input.xpDays,
    xpGainedLastYear: yearXp,
    weeklyAverageXp: weeklyAverageXp(input.xpDays),
    weeksActive: weeksActive(input.xpDays),
    streakWeeks: streakWeeksFromDays(input.streakCurrent),
    weeklyXp: Math.min(yearXp, 200),
    weeklyGoal: 200,
    streakSavers: 3,
    personalBestWeeks: streakWeeksFromDays(input.streakLongest),
    streakDays: input.streakCurrent,
    solves: input.solves,
    attempts: input.attempts,
    socials: input.meta.socials,
    interests: input.meta.interests,
    skills: input.meta.skills,
    tools: input.meta.tools,
    languages: input.meta.languages,
    certifications: input.meta.certifications,
    achievements: input.meta.achievements,
    events: input.meta.events,
    badges: input.meta.badges,
  };
}

export function qualifiedDaysFromPasses(passRows: { createdAt: Date }[]) {
  return passRows.map((row) => calendarDateKey(row.createdAt, 'UTC'));
}

export { computeStreak };
