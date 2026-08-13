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
  tone = 'default',
}: {
  compact?: boolean;
  drawer?: boolean;
  tone?: 'default' | 'hero' | 'aivora';
}) {
  const { t } = useTranslation();
  const tierLabel = useTierLabel();
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const logout = useLogout();

  const hero = tone === 'hero';
  const aivora = tone === 'aivora';
  const overlay = hero || aivora;

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
    <Link
      href={dashboardHref}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 transition-colors',
        hero
          ? 'border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/15'
          : aivora
            ? 'border-[var(--aivora-border-soft)] bg-white/10 backdrop-blur-sm hover:bg-white/15'
            : 'border-line/80 bg-bg-soft/70 hover:border-line-2 hover:bg-bg-soft',
      )}
    >
      <Avatar {...avatar} className={cn('size-8 ring-2', overlay ? 'ring-white/20' : 'ring-primary/10')} />
      <span className="hidden max-w-[120px] flex-col leading-tight xl:flex">
        <span className={cn('truncate text-sm font-semibold', overlay ? 'text-white' : 'text-ink')}>
          {name}
        </span>
        <span className={cn('text-[11px] font-medium', overlay ? 'text-white/70' : 'text-ink-3')}>
          {tierLabel(user.tier)}
        </span>
      </span>
    </Link>
  );
}

export function NavbarAuthLinks({
  compact = false,
  drawer = false,
  onNavigate,
  tone = 'default',
}: {
  compact?: boolean;
  drawer?: boolean;
  onNavigate?: () => void;
  tone?: 'default' | 'hero' | 'aivora';
}) {
  const { t } = useTranslation();
  const hero = tone === 'hero';
  const aivora = tone === 'aivora';
  const overlay = hero || aivora;
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
          className={cn(
            'inline-flex w-full items-center justify-center rounded-lg px-4 text-sm font-semibold',
            drawer ? 'h-10' : 'py-2.5',
            aivora
              ? 'bg-[var(--aivora-primary)] text-[var(--aivora-primary-ink)] hover:brightness-105'
              : hero
                ? 'bg-white text-slate-900 hover:bg-slate-50'
                : buttonClasses({ size: 'md', className: 'rounded-lg text-sm shadow-primary' }),
          )}
        >
          {t('navbarExtra.getStarted')}
        </Link>
      </div>
    );
  }

  if (aivora) {
    return (
      <Link
        href="/signup"
        className="inline-flex items-center justify-center rounded-full bg-[var(--aivora-primary)] px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[var(--aivora-primary-ink)] transition hover:brightness-105"
      >
        {t('navbarExtra.joinNow')}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className={buttonClasses({
          variant: 'ghost',
          size: 'sm',
          className: cn(
            'rounded-full px-4 text-sm font-medium',
            hero && 'text-white/85 hover:bg-white/10 hover:text-white',
          ),
        })}
      >
        {t('navbarExtra.logIn')}
      </Link>
      <Link
        href="/signup"
        className={
          hero
            ? 'inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition-all hover:scale-[1.02] hover:bg-slate-50'
            : buttonClasses({ size: 'sm', className: 'rounded-full px-5 shadow-primary' })
        }
      >
        {t('navbarExtra.getStarted')}
      </Link>
    </div>
  );
}
