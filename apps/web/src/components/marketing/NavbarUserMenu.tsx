'use client';

import Link from 'next/link';
import { LayoutDashboard, LogOut, Settings } from 'lucide-react';
import { Avatar } from '@/src/components/ui/avatar';
import { buttonClasses } from '@/src/components/ui/button';
import { ProfileDropdown } from '@/src/components/layout/ProfileDropdown';
import { useAuthHydrated } from '@/src/features/auth/useAuthHydrated';
import { useLogout } from '@/src/features/auth';
import { defaultDashboardPath } from '@/src/features/auth/dashboardRoutes';
import { useAuthStore } from '@/src/store/authStore';
import type { Tier } from '@/src/domain/user';
import { useTranslation } from '@/src/i18n';
import { cn } from '@/src/lib/utils';
import { getUserAvatarProps, getUserDisplayName } from '@/src/lib/userDisplay';

function useTierLabel() {
  const { t } = useTranslation();
  return (tier?: Tier) => {
    if (tier === 'premium') return t('profile.tierPremium');
    if (tier === 'standard') return t('profile.tierStandard');
    return t('profile.tierFreePlan');
  };
}

export function NavbarUserMenu({
  compact = false,
  drawer = false,
}: {
  compact?: boolean;
  drawer?: boolean;
}) {
  const { t } = useTranslation();
  const tierLabel = useTierLabel();
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const logout = useLogout();

  if (!hydrated) {
    return (
      <div
        className={cn('animate-pulse rounded-full bg-line/60', compact ? 'h-11 w-full' : 'h-9 w-36')}
        aria-hidden="true"
      />
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const name = getUserDisplayName(user, { compact: true });
  const avatar = getUserAvatarProps(user);
  const dashboardHref = defaultDashboardPath(user.role);

  if (compact) {
    return (
      <div className={cn('space-y-2', drawer && 'rounded-xl border border-line/80 bg-bg-soft/40 p-2')}>
        <div
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-2 py-2',
            drawer ? 'bg-bg-elev/80' : 'rounded-xl border border-line bg-bg-soft/80 px-3 py-3',
          )}
        >
          <Avatar {...avatar} className="size-9 ring-2 ring-primary/15" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{name}</p>
            <p className="text-[11px] font-medium text-primary">{tierLabel(user.tier)}</p>
          </div>
        </div>
        <div className="grid gap-0.5">
          <Link
            href={dashboardHref}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-bg-soft"
          >
            <LayoutDashboard className="size-4 text-ink-3" />
            {t('navbarExtra.dashboard')}
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-bg-soft"
          >
            <Settings className="size-4 text-ink-3" />
            {t('navbarExtra.settings')}
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-bad transition-colors hover:bg-bad/5"
          >
            <LogOut className="size-4" />
            {t('navbarExtra.logOut')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={dashboardHref}
        className={buttonClasses({ size: 'sm', className: 'rounded-full px-4' })}
      >
        {t('navbarExtra.dashboard')}
      </Link>
      <ProfileDropdown compact />
    </div>
  );
}

export function NavbarAuthLinks({
  compact = false,
  drawer = false,
  onNavigate,
}: {
  compact?: boolean;
  drawer?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  if (!hydrated || isAuthenticated) return null;

  if (compact) {
    return (
      <div className={cn('grid gap-2', drawer && 'rounded-xl border border-line/80 bg-bg-soft/40 p-2')}>
        <Link
          href="/login"
          onClick={onNavigate}
          className={buttonClasses({
            variant: 'outline',
            size: 'md',
            className: cn('w-full rounded-lg bg-bg-elev text-sm', drawer && 'h-10'),
          })}
        >
          {t('navbarExtra.logIn')}
        </Link>
        <Link
          href="/signup"
          onClick={onNavigate}
          className={buttonClasses({
            size: 'md',
            className: cn('w-full rounded-lg text-sm', drawer && 'h-10'),
          })}
        >
          {t('navbarExtra.getStarted')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Link
        href="/login"
        className={buttonClasses({
          variant: 'ghost',
          size: 'sm',
          className: 'rounded-full px-3.5 text-sm font-medium',
        })}
      >
        {t('navbarExtra.logIn')}
      </Link>
      <Link
        href="/signup"
        className={buttonClasses({ size: 'sm', className: 'rounded-full px-4' })}
      >
        {t('navbarExtra.getStarted')}
      </Link>
    </div>
  );
}
