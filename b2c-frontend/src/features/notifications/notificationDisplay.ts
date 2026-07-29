import type { AppNotification, NotificationStatus } from './notificationsApi';

const TYPE_COPY: Record<string, { title: string; body: string }> = {
  'daily-reminder': {
    title: 'Daily learning reminder',
    body: "You haven't completed a lesson today — jump back in and keep your streak going.",
  },
  'streak-milestone': {
    title: 'Streak milestone',
    body: 'You reached a new learning streak milestone. Keep up the great work.',
  },
};

function humanizeType(type: string): string {
  return type
    .split(/[-_]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function notificationTitle(item: AppNotification): string {
  return item.payload?.subject ?? TYPE_COPY[item.type]?.title ?? humanizeType(item.type);
}

export function notificationBody(item: AppNotification): string {
  return item.payload?.body ?? TYPE_COPY[item.type]?.body ?? 'You have a new notification.';
}

export function notificationTimestamp(item: AppNotification): string {
  return item.sentAt ?? item.createdAt;
}

export function formatNotificationDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatRelativeTime(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatNotificationDate(value);
}

export function statusLabel(status: NotificationStatus): string {
  if (status === 'sent') return 'Delivered';
  if (status === 'failed') return 'Failed';
  return 'Pending';
}

export function statusVariant(status: NotificationStatus): 'good' | 'bad' | 'outline' {
  if (status === 'sent') return 'good';
  if (status === 'failed') return 'bad';
  return 'outline';
}

export function channelLabel(channel: AppNotification['channel']): string {
  return channel === 'push' ? 'Push' : 'Email';
}
