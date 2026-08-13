'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, ChevronRight, Flame, Mail, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Skeleton } from '@/src/components/ui/skeleton';
import { useIsRtl, useTranslation } from '@/src/i18n';
import { cn } from '@/src/lib/utils';
import type { AppNotification } from '@/src/features/notifications/notificationsApi';
import {
  notificationTimestamp,
  useFormatRelativeTime,
  useNotificationBody,
  useNotificationTitle,
} from '@/src/features/notifications/notificationDisplay';
import { useNotifications } from '@/src/features/notifications/useNotifications';

const DROPDOWN_LIMIT = 5;

function typeIcon(type: string): LucideIcon {
  if (type.includes('streak')) return Flame;
  if (type.includes('reminder')) return Bell;
  return Mail;
}

function DropdownItem({ item, onNavigate }: { item: AppNotification; onNavigate: () => void }) {
  const Icon = typeIcon(item.type);
  const notificationTitle = useNotificationTitle();
  const notificationBody = useNotificationBody();
  const formatRelativeTime = useFormatRelativeTime();

  return (
    <Link
      href="/notifications"
      onClick={onNavigate}
      className="group flex gap-3 rounded-xl px-3 py-3 transition hover:bg-bg-soft"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-bg-soft text-primary">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="line-clamp-1 text-sm font-medium text-ink group-hover:text-primary">
            {notificationTitle(item)}
          </span>
          <span className="shrink-0 text-[11px] text-ink-3">
            {formatRelativeTime(notificationTimestamp(item))}
          </span>
        </span>
        <span className="mt-0.5 line-clamp-2 text-xs leading-5 text-ink-3">
          {notificationBody(item)}
        </span>
      </span>
    </Link>
  );
}

function DropdownSkeleton() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-16 rounded-xl" />
      ))}
    </div>
  );
}

export function NotificationDropdown() {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const { data, isLoading, isError, refetch } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const notifications = data?.notifications ?? [];
  const preview = useMemo(() => notifications.slice(0, DROPDOWN_LIMIT), [notifications]);
  const unreadCount = notifications.length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'relative inline-grid size-9 shrink-0 place-items-center rounded-xl border border-line text-ink-2 transition',
          'hover:border-line-2 hover:bg-bg-soft hover:text-ink',
          open && 'border-primary/30 bg-primary-soft text-primary',
        )}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t('nav.notifications')}
      >
        <Bell className="size-[18px]" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-bad px-1 text-[10px] font-semibold leading-[18px] text-white ring-2 ring-bg-elev">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,360px)] overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
              <div>
                <p className="text-sm font-semibold text-ink">{t('nav.notifications')}</p>
                <p className="text-xs text-ink-3">
                  {unreadCount > 0
                    ? t('notifications.inHistory', { count: String(unreadCount) })
                    : t('notifications.empty')}
                </p>
              </div>
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="grid size-8 place-items-center rounded-lg border border-line text-ink-3 transition hover:bg-bg-soft hover:text-ink"
                aria-label={t('notifications.settingsLink')}
              >
                <Settings className="size-4" />
              </Link>
            </div>

            {isLoading ? <DropdownSkeleton /> : null}

            {isError ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-ink-2">{t('notifications.loadError')}</p>
                <Button
                  variant="soft"
                  size="sm"
                  className="mt-3 rounded-full px-4"
                  onClick={() => refetch()}
                >
                  {t('common.retry')}
                </Button>
              </div>
            ) : null}

            {!isLoading && !isError && preview.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto size-7 text-ink-3" />
                <p className="mt-3 text-sm text-ink-2">{t('notifications.allCaughtUp')}</p>
                <p className="mt-1 text-xs text-ink-3">{t('notifications.emptyDropdownHint')}</p>
              </div>
            ) : null}

            {!isLoading && !isError && preview.length > 0 ? (
              <div className="max-h-[360px] overflow-y-auto p-2">
                {preview.map((item) => (
                  <DropdownItem key={item.id} item={item} onNavigate={() => setOpen(false)} />
                ))}
              </div>
            ) : null}

            <div className="border-t border-line p-2">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1 rounded-xl px-3 py-2.5 text-sm font-medium text-primary transition hover:bg-primary-soft"
              >
                {t('common.viewAll')}
                <ChevronRight className={`size-4${isRtl ? ' rotate-180' : ''}`} />
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
