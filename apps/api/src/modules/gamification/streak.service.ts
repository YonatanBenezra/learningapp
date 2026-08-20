import { User } from '../users/user.model';
import { logger } from '../../common/utils/logger';
import { dayNumberInTz } from '../../common/utils/tz';

// A streak is stale once the user has missed a full calendar day (in their tz):
// today (diff 0) and yesterday (diff 1) keep it alive; diff >= 2 breaks it.
export function isStreakStale(lastActivity: Date, now: Date, tz = 'UTC'): boolean {
  return dayNumberInTz(now, tz) - dayNumberInTz(lastActivity, tz) >= 2;
}

// Daily job (§8): zero out streaks for users who missed a day so the displayed
// streak stays accurate even before their next activity. Timezone-aware per user.
export async function resetStaleStreaks(now: Date = new Date()): Promise<number> {
  const users = await User.find({ 'streak.current': { $gt: 0 } }).select(
    'streak preferences.timezone',
  );
  let reset = 0;
  for (const u of users) {
    const s = u.streak as { current?: number; lastActivityDate?: Date } | undefined;
    const prefs = u.preferences as { timezone?: string } | undefined;
    const last = s?.lastActivityDate;
    if (last && isStreakStale(last, now, prefs?.timezone ?? 'UTC')) {
      u.set('streak.current', 0);
      await u.save();
      reset += 1;
    }
  }
  logger.info({ reset }, 'Stale streaks reset');
  return reset;
}
