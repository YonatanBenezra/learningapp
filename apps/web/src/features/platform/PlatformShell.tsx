'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Flame, Search, UserRound } from 'lucide-react';
import { ThemeToggle } from '@/src/components/ui/theme-toggle';
import { ProfileDropdown } from '@/src/components/layout/ProfileDropdown';
import { NotificationDropdown } from '@/src/components/layout/NotificationDropdown';
import { useAuthHydrated } from '@/src/features/auth/useAuthHydrated';
import { useAuthStore } from '@/src/store/authStore';
import { guestCompletedCount } from '@/src/features/practice/guestStorage';
import { APP_NAME } from '@/src/lib/brand';
import { BrandWordmark, LabPathMark } from '@/src/components/ui/brand-wordmark';
import { cn } from '@/src/lib/utils';
import { PracticeSyncBootstrap } from '@/src/features/practice/usePracticeSync';
import { platformContainerClass } from './platformLayout';

const NAV_ITEMS = [
  { href: '/problems', label: 'Problems', isActive: (path: string) => path === '/problems' || path.startsWith('/problems/') },
  {
    href: '/simulations',
    label: 'Simulations',
    isActive: (path: string) => path === '/simulations' || path.startsWith('/simulations/'),
  },
  {
    href: '/guided-courses',
    label: 'Courses',
    isActive: (path: string) => path === '/guided-courses' || path.startsWith('/guided-courses/'),
  },
  { href: '/contest', label: 'Contest', isActive: (path: string) => path.startsWith('/contest') },
] as const;

function NavSearch({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
}) {
  return (
    <label className="relative hidden sm:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#999]" strokeWidth={2} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit?.();
        }}
        placeholder="Search"
        className="h-8 w-[200px] rounded-full border-0 bg-[#f4f4f5] pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-[#999] focus:bg-[#ececee] lg:w-[220px] dark:bg-bg-soft dark:focus:bg-bg-lav"
      />
    </label>
  );
}

function NavbarStreak({ count }: { count: number }) {
  return (
    <div
      className="flex items-center gap-1 rounded-md px-1.5 py-1 text-sm text-[#555] dark:text-ink-2"
      title="Practice streak"
    >
      <Flame className="size-[18px] text-[#999]" strokeWidth={2} />
      <span className="min-w-[1ch] font-medium tabular-nums">{count}</span>
    </div>
  );
}

function NavbarPremiumButton() {
  return (
    <Link
      href="/upgrade"
      className="rounded-md bg-[#fff4e5] px-3 py-1.5 text-sm font-semibold text-[#ffa116] transition-colors hover:bg-[#ffedd5] dark:bg-warn/10 dark:text-warn"
    >
      Premium
    </Link>
  );
}

function NavbarUserArea() {
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  if (!hydrated) {
    return <div className="size-8 animate-pulse rounded-full bg-[#ececee]" aria-hidden />;
  }

  if (isAuthenticated && user) {
    return <ProfileDropdown compact />;
  }

  return (
    <Link
      href="/login"
      className="grid size-8 place-items-center overflow-hidden rounded-full bg-[#ececee] text-[#777] transition-opacity hover:opacity-90 dark:bg-bg-soft"
      aria-label="Log in"
    >
      <UserRound className="size-4" strokeWidth={2} />
    </Link>
  );
}

export function PlatformNavbar({
  searchQuery,
  onSearchChange,
}: {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [localSearch, setLocalSearch] = useState('');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const user = useAuthStore((s) => s.user);
  const streak = isAuthenticated ? (user?.streak?.current ?? 0) : guestCompletedCount();
  const searchValue = searchQuery ?? localSearch;

  function handleSearchChange(value: string) {
    if (onSearchChange) onSearchChange(value);
    else setLocalSearch(value);
  }

  function submitSearch() {
    const q = searchValue.trim();
    if (onSearchChange) return;
    router.push(q ? `/problems?q=${encodeURIComponent(q)}` : '/problems');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#e5e5e5] bg-white dark:border-line-2 dark:bg-bg">
      <div className={cn(platformContainerClass, 'flex h-[50px] items-center gap-6')}>
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={`${APP_NAME} home`}
        >
          <LabPathMark size="sm" />
          <BrandWordmark size="sm" className="font-semibold" />
        </Link>

        <nav className="flex items-center gap-5" aria-label="Main">
          {NAV_ITEMS.map((item) => {
            const active = item.isActive(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-normal transition-colors',
                  active ? 'text-ink' : 'text-[#555] hover:text-ink dark:text-ink-2',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <NavSearch value={searchValue} onChange={handleSearchChange} onSubmit={submitSearch} />

          <NotificationDropdown />

          <NavbarStreak count={streak} />

          <ThemeToggle
            aria-label="Toggle theme"
            className="size-8 rounded-md border-0 bg-transparent text-[#555] hover:bg-[#f4f4f5] hover:text-ink dark:text-ink-2 dark:hover:bg-bg-soft dark:hover:text-ink"
          />

          <NavbarUserArea />

          <NavbarPremiumButton />
        </div>
      </div>
    </header>
  );
}

export function PlatformShell({
  children,
  searchQuery,
  onSearchChange,
  showFooter = true,
}: {
  children: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  showFooter?: boolean;
}) {
  return (
    <>
      <PracticeSyncBootstrap />
      <PlatformNavbar searchQuery={searchQuery} onSearchChange={onSearchChange} />
      <main id="main-content" className="flex min-h-0 flex-1 flex-col bg-white dark:bg-bg">
        {children}
      </main>
      {showFooter ? <PlatformFooter /> : null}
    </>
  );
}

function PlatformFooter() {
  return (
    <footer className="mt-auto border-t border-[#e5e5e5] bg-white dark:border-line-2 dark:bg-bg">
      <div
        className={cn(
          platformContainerClass,
          'flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between',
        )}
      >
        <div className="flex items-center gap-2 text-sm text-[#666] dark:text-ink-2">
          <LabPathMark size="sm" />
          <span>© {new Date().getFullYear()} {APP_NAME}</span>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#666] dark:text-ink-2">
          <Link href="/problems" className="hover:text-ink">
            Problems
          </Link>
          <Link href="/simulations" className="hover:text-ink">
            Simulations
          </Link>
          <Link href="/guided-courses" className="hover:text-ink">
            Courses
          </Link>
          <Link href="/contest" className="hover:text-ink">
            Contest
          </Link>
          <Link href="/login" className="hover:text-ink">
            Log in
          </Link>
          <Link href="/signup" className="hover:text-ink">
            Sign up
          </Link>
          <Link href="/contact" className="hover:text-ink">
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  );
}
