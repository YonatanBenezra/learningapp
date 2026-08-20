import { User } from '../users/user.model';
import { Notification } from './notification.model';
import { sendNotification } from './notification.service';
import { sameDayInTz } from '../../common/utils/tz';
import { logger } from '../../common/utils/logger';

type Sender = typeof sendNotification;

// Daily nudge (§10): email opted-in users who have NOT completed a lesson today
// (in their own timezone). Idempotent per user per calendar day, so it can run
// hourly (to cover every timezone) without double-sending. Sender is injectable
// for testing.
export async function sendDailyReminders(
  now: Date = new Date(),
  send: Sender = sendNotification,
): Promise<number> {
  const users = await User.find({ 'preferences.dailyNotification': true }).select(
    'email preferences streak',
  );

  let sent = 0;
  for (const u of users) {
    const tz = (u.preferences as { timezone?: string } | undefined)?.timezone ?? 'UTC';
    const lastActivity = (u.streak as { lastActivityDate?: Date } | undefined)?.lastActivityDate;

    // Already active today → no nudge needed.
    if (lastActivity && sameDayInTz(lastActivity, now, tz)) continue;

    // Already reminded today → skip (idempotent across hourly runs).
    const lastReminder = await Notification.findOne({
      userId: u._id,
      type: 'daily-reminder',
      status: 'sent',
    })
      .sort({ sentAt: -1 })
      .select('sentAt');
    if (lastReminder?.sentAt && sameDayInTz(lastReminder.sentAt, now, tz)) continue;

    await send(String(u._id), 'daily-reminder', 'email');
    sent += 1;
  }

  logger.info({ sent, candidates: users.length }, 'Daily reminders processed');
  return sent;
}
