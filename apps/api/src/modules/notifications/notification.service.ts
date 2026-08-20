import { Notification } from './notification.model';
import { User } from '../users/user.model';
import { logger } from '../../common/utils/logger';
import {
  getChannel,
  type NotificationChannel,
  type NotificationChannelAdapter,
} from './notification.channels';

export type { NotificationChannel };

// Message templates keyed by notification type.
const TEMPLATES: Record<string, { subject: string; body: string }> = {
  'daily-reminder': {
    subject: 'Keep your learning streak alive! 🔥',
    body: "You haven't completed a lesson today — jump back in and keep your streak going.",
  },
};

function buildMessage(type: string): { subject: string; body: string } {
  return TEMPLATES[type] ?? { subject: 'Notification', body: `You have a new ${type} notification.` };
}

type ChannelResolver = (channel: NotificationChannel) => NotificationChannelAdapter;

// Channel-agnostic send (§10). Records a Notification, dispatches via the resolved
// channel, and marks sent/failed. Never throws — a single failure must not abort a
// batch cron. The channel resolver is injectable for testing.
export async function sendNotification(
  userId: string,
  type: string,
  channel: NotificationChannel = 'email',
  resolveChannel: ChannelResolver = getChannel,
) {
  const notification = await Notification.create({ userId, type, channel, status: 'pending' });
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    const { subject, body } = buildMessage(type);
    await resolveChannel(channel).send({ to: user.email as string, subject, body });
    notification.set('status', 'sent');
    notification.set('sentAt', new Date());
    notification.set('payload', { subject });
    await notification.save();
  } catch (err) {
    notification.set('status', 'failed');
    await notification.save();
    logger.error({ err, userId, type, channel }, 'Notification send failed');
  }
  return notification;
}

export async function listNotifications(userId: string) {
  return Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
}
