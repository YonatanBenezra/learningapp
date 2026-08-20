import { Achievement } from './achievement.model';
import { UserAchievement } from './userAchievement.model';
import { ACHIEVEMENTS } from './achievement.catalog';
import { logger } from '../../common/utils/logger';

// Idempotent catalog upsert — safe to run on every boot.
export async function seedAchievements(): Promise<void> {
  await Promise.all(
    ACHIEVEMENTS.map((a) => Achievement.updateOne({ key: a.key }, { $set: a }, { upsert: true })),
  );
}

// Grants one achievement; returns true ONLY if newly awarded. Idempotent via the
// unique (userId, achievementId) index — a duplicate is a benign no-op.
async function grant(userId: string, key: string): Promise<boolean> {
  const ach = await Achievement.findOne({ key });
  if (!ach) return false; // catalog not seeded / unknown key
  try {
    await UserAchievement.create({ userId, achievementId: ach._id });
    return true;
  } catch (err) {
    if (err instanceof Error && err.message.includes('E11000')) return false;
    throw err;
  }
}

export interface AchievementEvent {
  lessonsCompleted?: number; // total lessons the user has completed
  streak?: number; // current streak length
  courseCompleted?: boolean;
  assessmentScore?: number; // 0–100 of a just-graded assessment
}

// Pure-ish rules → keys, then idempotent grants. Returns the NEWLY-earned keys.
export async function evaluateAndAward(
  userId: string,
  event: AchievementEvent,
): Promise<string[]> {
  const keys: string[] = [];
  if (event.lessonsCompleted !== undefined) {
    if (event.lessonsCompleted >= 1) keys.push('first-lesson');
    if (event.lessonsCompleted >= 10) keys.push('ten-lessons');
  }
  if (event.streak !== undefined) {
    if (event.streak >= 3) keys.push('streak-3');
    if (event.streak >= 7) keys.push('streak-7');
    if (event.streak >= 30) keys.push('streak-30');
  }
  if (event.courseCompleted) keys.push('course-complete');
  if (event.assessmentScore !== undefined) {
    if (event.assessmentScore >= 70) keys.push('assessment-pass');
    if (event.assessmentScore >= 100) keys.push('perfect-score');
  }

  const awarded: string[] = [];
  for (const key of keys) {
    if (await grant(userId, key)) awarded.push(key);
  }
  return awarded;
}

// Non-throwing wrapper for use inside core flows — gamification must never break
// lesson completion or a submission.
export async function safeAward(userId: string, event: AchievementEvent): Promise<string[]> {
  try {
    return await evaluateAndAward(userId, event);
  } catch (err) {
    logger.error({ err, userId }, 'Achievement awarding failed (non-fatal)');
    return [];
  }
}

export async function listAchievements() {
  return Achievement.find().sort({ createdAt: 1 });
}

export async function getMyAchievements(userId: string) {
  const [earned, total] = await Promise.all([
    UserAchievement.find({ userId }).populate('achievementId').sort({ earnedAt: -1 }),
    Achievement.countDocuments(),
  ]);
  return {
    earnedCount: earned.length,
    total,
    achievements: earned.map((ua) => {
      const a = ua.achievementId as unknown as {
        key: string;
        title: string;
        description?: string;
        icon?: string;
      };
      return { key: a.key, title: a.title, description: a.description, icon: a.icon, earnedAt: ua.earnedAt };
    }),
  };
}
