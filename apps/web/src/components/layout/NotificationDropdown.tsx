'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BellRing, MoreHorizontal, Settings } from 'lucide-react';
import { cn } from '@/src/lib/utils';

type NotificationTab = 'social' | 'updates' | 'events';

const TABS: { id: NotificationTab; label: string }[] = [
  { id: 'social', label: 'Social' },
  { id: 'updates', label: 'Updates' },
  { id: 'events', label: 'Events' },
];

function NullEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16">
      <div
        className="select-none text-[72px] font-black leading-none tracking-tight text-[#ececee] dark:text-line/40"
        style={{
          fontFamily: 'var(--font-outfit, ui-sans-serif, system-ui, sans-serif)',
          transform: 'perspective(400px) rotateX(18deg) rotateY(-12deg)',
        }}
        aria-hidden
      >
        NULL
      </div>
      <p className="mt-4 text-sm text-[#999] dark:text-ink-2">No notifications yet</p>
    </div>
  );
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<NotificationTab>('social');
  const [hasUnread, setHasUnread] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative grid size-8 place-items-center rounded-md text-[#555] transition-colors hover:bg-[#f4f4f5] hover:text-ink dark:text-ink-2 dark:hover:bg-bg-soft"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="size-[18px]" strokeWidth={2} />
        {hasUnread && !open ? (
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#ef4743]" aria-hidden />
        ) : null}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            role="dialog"
            aria-label="Notifications"
            className="absolute end-0 top-full z-50 mt-2 w-[min(100vw-2rem,380px)] overflow-hidden rounded-xl border border-[#e5e5e5] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:border-line-2 dark:bg-bg-elev"
          >
            <div className="flex items-center justify-between border-b border-[#e5e5e5] px-4 dark:border-line-2">
              <div className="flex items-end gap-6">
                {TABS.map((item) => {
                  const active = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id)}
                      className={cn(
                        'relative py-3 text-sm transition-colors',
                        active
                          ? 'font-medium text-ink'
                          : 'text-[#888] hover:text-ink dark:text-ink-2',
                      )}
                    >
                      {item.label}
                      {active ? (
                        <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-ink dark:bg-ink" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-0.5 pb-1">
                <button
                  type="button"
                  onClick={() => setHasUnread(false)}
                  className="grid size-8 place-items-center rounded-md text-[#888] transition-colors hover:bg-[#f4f4f5] hover:text-ink dark:text-ink-2 dark:hover:bg-bg-soft"
                  aria-label="Mark all as read"
                  title="Mark all as read"
                >
                  <BellRing className="size-4" strokeWidth={2} />
                </button>
                <Link
                  href="/notifications"
                  onClick={() => setOpen(false)}
                  className="grid size-8 place-items-center rounded-md text-[#888] transition-colors hover:bg-[#f4f4f5] hover:text-ink dark:text-ink-2 dark:hover:bg-bg-soft"
                  aria-label="Notification settings"
                  title="Settings"
                >
                  <Settings className="size-4" strokeWidth={2} />
                </Link>
                <button
                  type="button"
                  className="grid size-8 place-items-center rounded-md text-[#888] transition-colors hover:bg-[#f4f4f5] hover:text-ink dark:text-ink-2 dark:hover:bg-bg-soft"
                  aria-label="More options"
                  title="More"
                >
                  <MoreHorizontal className="size-4" strokeWidth={2} />
                </button>
              </div>
            </div>

            <NullEmptyState />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
