'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Settings,
  CreditCard,
  Bell,
  Palette,
  Globe,
  LifeBuoy,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/src/store/authStore';
import { useLogout } from '@/src/features/auth';
import { Avatar } from '@/src/components/ui/avatar';
import { getUserAvatarProps, getUserDisplayName } from '@/src/lib/userDisplay';
import { useTranslation, useIsRtl } from '@/src/i18n';
import { cn } from '@/src/lib/utils';
import type { Messages } from '@/src/i18n/types';

type ProfileMenuItemId = keyof Messages['profileMenu'];

interface ProfileMenuItem {
  id: Exclude<ProfileMenuItemId, 'logout' | 'openMenu'>;
  icon: React.ElementType;
  href: string;
}

const menuItems: ProfileMenuItem[] = [
  { id: 'myProfile', icon: User, href: '/profile' },
  { id: 'accountSettings', icon: Settings, href: '/settings' },
  { id: 'billing', icon: CreditCard, href: '/billing' },
  { id: 'notifications', icon: Bell, href: '/notifications' },
  { id: 'appearance', icon: Palette, href: '/settings' },
  { id: 'language', icon: Globe, href: '/settings' },
  { id: 'helpCenter', icon: LifeBuoy, href: '/support' },
];

export function ProfileDropdown({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center rounded-full border border-line transition-colors hover:border-line-2 hover:bg-bg-soft',
          compact ? 'p-0.5' : 'gap-2 py-1 pl-1 pr-2.5',
        )}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t('profileMenu.openMenu')}
      >
        <Avatar {...getUserAvatarProps(user)} className="size-8" />
        {compact ? null : (
          <span className="hidden max-w-[120px] truncate text-sm font-medium text-ink md:block">
            {getUserDisplayName(user, { compact: true })}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="absolute end-0 top-full z-50 mt-2 w-[240px] overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card"
          >
            <div className="border-b border-line px-4 py-3.5">
              <p className="text-sm font-semibold text-ink">{getUserDisplayName(user)}</p>
              <p className="mt-0.5 text-xs text-ink-3">{user?.email ?? ''}</p>
            </div>

            <div className="p-1.5">
              {menuItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-2 transition-all duration-150 hover:bg-bg-soft hover:text-ink"
                >
                  <item.icon className="size-4 shrink-0 text-ink-3 group-hover:text-ink-2" />
                  <span className="flex-1">{t(`profileMenu.${item.id}`)}</span>
                  <ChevronRight
                    className={cn(
                      'size-3.5 shrink-0 text-ink-3/50 opacity-0 transition-opacity group-hover:opacity-100',
                      isRtl && 'rtl-flip',
                    )}
                  />
                </a>
              ))}

              <div className="my-1.5 h-px bg-line" />

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-bad transition-all duration-150 hover:bg-bad-soft"
              >
                <LogOut className="size-4 shrink-0" />
                <span>{t('profileMenu.logout')}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
