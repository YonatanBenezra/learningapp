'use client';

import Link from 'next/link';
import { LayoutDashboard, LogOut, Settings, UserRound } from 'lucide-react';
import { Avatar } from '@/src/components/ui/avatar';
import { useAuthHydrated } from '@/src/features/auth/useAuthHydrated';
import { useLogout } from '@/src/features/auth';
import { useAuthStore } from '@/src/store/authStore';
import type { Tier } from '@/src/domain/user';
import { cn } from '@/src/lib/utils';

function userDisplayName(email?: string) {
  if (!email) return 'User';
  const raw = email.split('@')[0] ?? 'User';
  const word = raw.split(/[._-]/)[0] ?? raw;
  const name = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  const maxLen = 10;
  return name.length <= maxLen ? name : `${name.slice(0, maxLen)}…`;
}

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
        className={cn('animate-pulse rounded-full bg-line/60', compact ? 'size-11' : 'h-11 w-36')}
        aria-hidden="true"
      />
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const name = userDisplayName(user.email);

  if (compact) {
    return (
      <div className="space-y-3 border-t border-bg-soft pt-5">
        <div className="flex items-center gap-3">
          <Avatar name={user.email} className="size-11" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">{name}</p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-primary">
              {tierLabel(user.tier)}
            </p>
          </div>
        </div>
        <div className="grid gap-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-medium text-ink hover:bg-bg-soft"
          >
            <LayoutDashboard className="size-4 text-ink-3" />
            Dashboard
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-medium text-ink hover:bg-bg-soft"
          >
            <Settings className="size-4 text-ink-3" />
            Settings
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-medium text-bad hover:bg-bad/5"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/dashboard"
        className="relative grid size-11 place-items-center rounded-full border border-line-2 transition-opacity hover:opacity-85"
        aria-label="Open dashboard"
      >
        <Avatar name={user.email} className="size-11 border-0" />
      </Link>
      <span className="flex max-w-[120px] flex-col leading-tight">
        <Link
          href="/dashboard"
          className="truncate text-[15px] font-bold text-ink transition-colors hover:text-primary"
        >
          {name}
        </Link>
        <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
          {tierLabel(user.tier)}
        </span>
      </span>
    </div>
  );
}

export function NavbarAuthLinks() {
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  if (!hydrated || isAuthenticated) return null;

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="relative grid size-11 place-items-center rounded-full border border-line-2 text-ink transition-opacity hover:opacity-85"
        aria-label="Sign in"
      >
        <UserRound className="size-5" strokeWidth={1.8} />
        <span className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full border border-white bg-primary text-[10px] font-bold text-primary-ink">
          +
        </span>
      </Link>
      <span className="flex flex-col leading-tight">
        <Link
          href="/login"
          className="text-[15px] font-bold text-ink transition-colors hover:text-primary"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="text-[13px] font-medium text-ink-3 transition-colors hover:text-primary"
        >
          Register
        </Link>
      </span>
    </div>
  );
}
