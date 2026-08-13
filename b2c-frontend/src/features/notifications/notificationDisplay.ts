'use client';

import { useCallback } from 'react';
import type { MessageKey } from '@/src/i18n/locale';
import { useTranslation } from '@/src/i18n';
import type { AppNotification, NotificationStatus } from './notificationsApi';

const TYPE_KEYS: Record<string, { title: MessageKey; body: MessageKey }> = {
  'daily-reminder': {
    title: 'notifications.dailyReminderTitle',
    body: 'notifications.dailyReminderBody',
  },
  'streak-milestone': {
    title: 'notifications.streakMilestoneTitle',
    body: 'notifications.streakMilestoneBody',
  },
};

function humanizeType(type: string): string {
  return type
    .split(/[-_]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function localeTag(locale: string): string {
  if (locale === 'he') return 'he-IL';
  if (locale === 'bn') return 'bn-BD';
  if (locale === 'de') return 'de-DE';
  return 'en';
}

export function notificationTimestamp(item: AppNotification): string {
  return item.sentAt ?? item.createdAt;
}

export function useNotificationTitle() {
  const { t } = useTranslation();
  return useCallback(
    (item: AppNotification): string =>
      item.payload?.subject ??
      (TYPE_KEYS[item.type] ? t(TYPE_KEYS[item.type].title) : humanizeType(item.type)),
    [t],
  );
}

export function useNotificationBody() {
  const { t } = useTranslation();
  return useCallback(
    (item: AppNotification): string =>
      item.payload?.body ??
      (TYPE_KEYS[item.type] ? t(TYPE_KEYS[item.type].body) : t('notifications.defaultBody')),
    [t],
  );
}

export function useFormatNotificationDate() {
  const { locale } = useTranslation();
  return useCallback(
    (value: string): string =>
      new Intl.DateTimeFormat(localeTag(locale), {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(value)),
    [locale],
  );
}

export function useFormatRelativeTime() {
  const { t } = useTranslation();
  const formatNotificationDate = useFormatNotificationDate();
  return useCallback(
    (value: string): string => {
      const diffMs = Date.now() - new Date(value).getTime();
      const minutes = Math.floor(diffMs / 60_000);
      if (minutes < 1) return t('notifications.justNow');
      if (minutes < 60) return t('notifications.minutesAgo', { minutes: String(minutes) });
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return t('notifications.hoursAgo', { hours: String(hours) });
      const days = Math.floor(hours / 24);
      if (days < 7) return t('notifications.daysAgo', { days: String(days) });
      return formatNotificationDate(value);
    },
    [t, formatNotificationDate],
  );
}

export function useStatusLabel() {
  const { t } = useTranslation();
  return useCallback(
    (status: NotificationStatus): string => {
      if (status === 'sent') return t('notifications.statusDelivered');
      if (status === 'failed') return t('notifications.statusFailed');
      return t('notifications.statusPending');
    },
    [t],
  );
}

export function useChannelLabel() {
  const { t } = useTranslation();
  return useCallback(
    (channel: AppNotification['channel']): string =>
      channel === 'push' ? t('notifications.channelPush') : t('notifications.channelEmail'),
    [t],
  );
}

export function statusVariant(status: NotificationStatus): 'good' | 'bad' | 'outline' {
  if (status === 'sent') return 'good';
  if (status === 'failed') return 'bad';
  return 'outline';
}
