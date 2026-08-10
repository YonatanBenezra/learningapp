'use client';

import Link from 'next/link';
import { LayoutDashboard, LogOut, Settings } from 'lucide-react';
import { Avatar } from '@/src/components/ui/avatar';
import { buttonClasses } from '@/src/components/ui/button';
import { useAuthHydrated } from '@/src/features/auth/useAuthHydrated';
import { useLogout } from '@/src/features/auth';
import { defaultDashboardPath } from '@/src/features/auth/dashboardRoutes';
import { useAuthStore } from '@/src/store/authStore';
import type { Tier } from '@/src/domain/user';
import { cn } from '@/src/lib/utils';
import { getUserAvatarProps, getUserDisplayName } from '@/src/lib/userDisplay';

function tierLabel(tier?: Tier) {
  if (tier === 'premium') return 'Premium';
  if (tier === 'standard') return 'Standard';
  return 'Free plan';
}

export function NavbarUserMenu({ compact = false }: { compact?: boolean }) {
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const logout = useLogout();

  if (!hydrated) {
    return (
      <div
        className={cn('animate-pulse rounded-full bg-line/60', compact ? 'h-11 w-full' : 'h-9 w-28')}
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
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-xl border border-line bg-bg-soft/80 px-3 py-3">
          <Avatar {...avatar} className="size-10 ring-2 ring-primary/15" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{name}</p>
            <p className="text-xs font-medium text-primary">{tierLabel(user.tier)}</p>
          </div>
        </div>
        <div className="grid gap-0.5">
          <Link
            href={dashboardHref}
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-bg-soft"
          >
            <LayoutDashboard className="size-4 text-ink-3" />
            Dashboard
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-bg-soft"
          >
            <Settings className="size-4 text-ink-3" />
            Settings
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-bad transition-colors hover:bg-bad/5"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={dashboardHref}
      className="inline-flex items-center gap-2 rounded-full border border-line/80 bg-bg-soft/70 py-1 pl-1 pr-3 transition-colors hover:border-line-2 hover:bg-bg-soft"
    >
      <Avatar {...avatar} className="size-8 ring-2 ring-primary/10" />
      <span className="hidden max-w-[120px] flex-col leading-tight xl:flex">
        <span className="truncate text-sm font-semibold text-ink">{name}</span>
        <span className="text-[11px] font-medium text-ink-3">{tierLabel(user.tier)}</span>
      </span>
    </Link>
  );
}

export function NavbarAuthLinks({
  compact = false,
  onNavigate,
}: {
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  if (!hydrated || isAuthenticated) return null;

  if (compact) {
    return (
      <div className="grid gap-2">
        <Link
          href="/login"
          onClick={onNavigate}
          className={buttonClasses({
            variant: 'outline',
            size: 'md',
            className: 'w-full rounded-xl bg-bg-elev text-sm',
          })}
        >
          Log in
        </Link>
        <Link
          href="/signup"
          onClick={onNavigate}
          className={buttonClasses({
            size: 'md',
            className: 'w-full rounded-xl text-sm shadow-primary',
          })}
        >
          Start free
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className={buttonClasses({
          variant: 'ghost',
          size: 'sm',
          className: 'rounded-lg px-3 text-sm font-medium',
        })}
      >
        Log in
      </Link>
      <Link
        href="/signup"
        className={buttonClasses({
          size: 'sm',
          className: 'rounded-lg px-4 text-sm shadow-primary',
        })}
      >
        Start free
      </Link>
    </div>
  );
}
