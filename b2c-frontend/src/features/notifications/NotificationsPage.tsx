'use client';

import Link from 'next/link';
import { Bell, Flame, Mail, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Skeleton } from '@/src/components/ui/skeleton';
import { useTranslation } from '@/src/i18n';
import type { AppNotification } from './notificationsApi';
import {
  channelLabel,
  formatNotificationDate,
  notificationBody,
  notificationTimestamp,
  notificationTitle,
  statusLabel,
  statusVariant,
} from './notificationDisplay';
import { useNotifications } from './useNotifications';

function typeIcon(type: string): LucideIcon {
  if (type.includes('streak')) return Flame;
  if (type.includes('reminder')) return Bell;
  return Mail;
}

function NotificationRow({ item }: { item: AppNotification }) {
  const Icon = typeIcon(item.type);
  const timestamp = notificationTimestamp(item);

  return (
    <article className="flex gap-4 border-b border-line px-5 py-4 last:border-b-0 sm:px-6">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-bg-soft text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-medium text-ink">{notificationTitle(item)}</h3>
          <time className="shrink-0 text-xs text-ink-3">{formatNotificationDate(timestamp)}</time>
        </div>
        <p className="mt-1 text-sm leading-6 text-ink-2">{notificationBody(item)}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant(item.status)}>{statusLabel(item.status)}</Badge>
          <span className="rounded-full border border-line bg-bg-soft px-2.5 py-0.5 text-xs text-ink-3">
            {channelLabel(item.channel)}
          </span>
        </div>
      </div>
    </article>
  );
}

function PageSkeleton() {
  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8 xl:px-10">
      <Skeleton className="h-24 w-full max-w-2xl rounded-xl" />
      <Skeleton className="h-[420px] w-full rounded-2xl" />
    </div>
  );
}

export function NotificationsPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useNotifications();
  const notifications = data?.notifications ?? [];

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8 xl:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {t('nav.notifications')}
          </h1>
          <p className="mt-2 text-sm leading-7 text-ink-2 sm:text-base">
            {notifications.length > 0
              ? `${notifications.length} notification${notifications.length === 1 ? '' : 's'} in your history`
              : 'Reminders and updates from your learning activity appear here.'}
          </p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-bg-soft text-primary">
          <Bell className="size-5" />
        </span>
      </div>

      <section className="overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card">
        {isError ? (
          <div className="px-5 py-14 text-center sm:px-6">
            <p className="text-sm text-ink-2">Could not load notifications.</p>
            <Button variant="soft" className="mt-4 rounded-full px-5" onClick={() => refetch()}>
              {t('common.retry')}
            </Button>
          </div>
        ) : null}

        {!isError && notifications.length === 0 ? (
          <div className="px-5 py-14 text-center sm:px-6">
            <Bell className="mx-auto size-8 text-ink-3" />
            <p className="mt-4 text-sm leading-6 text-ink-2">No notifications yet.</p>
            <p className="mt-2 text-sm text-ink-3">
              Enable daily reminders in settings to receive learning nudges by email.
            </p>
            <Link href="/settings" className="mt-5 inline-block">
              <Button variant="soft" className="rounded-full px-5">
                <Settings className="size-4" />
                Notification settings
              </Button>
            </Link>
          </div>
        ) : null}

        {!isError && notifications.length > 0 ? (
          <>
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <p className="text-sm text-ink-2">Showing your latest {notifications.length} notifications</p>
            </div>
            <div>{notifications.map((item) => (
              <NotificationRow key={item.id} item={item} />
            ))}</div>
          </>
        ) : null}
      </section>
    </div>
  );
}

export default NotificationsPage;
