'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Search, UserRound, X } from 'lucide-react';
import { LanguageSelector } from '@/src/components/layout/LanguageSelector';
import { ThemeToggle } from '@/src/components/ui/theme-toggle';
import { NavbarAuthLinks, NavbarUserMenu } from '@/src/components/marketing/NavbarUserMenu';
import { NavbarSearchOverlay } from '@/src/components/marketing/NavbarSearchOverlay';
import { useAuthHydrated } from '@/src/features/auth/useAuthHydrated';
import { myCoursesPath } from '@/src/features/auth/learnerRoutes';
import { useAuthStore } from '@/src/store/authStore';
import { NAV_LINKS } from './data';
import { Container } from './Container';

function FiStudyLogo() {
  return (
    <Link href="/" className="relative inline-flex shrink-0 flex-col leading-none text-primary" aria-label="FiStudy Home">
      <span className="text-[34px] font-bold tracking-[-0.02em]">
        <span className="text-primary">AI</span>
        <span className="text-ink">Study</span>
      </span>
      <svg
        className="absolute -bottom-1 left-[34px] h-[10px] w-[72px]"
        viewBox="0 0 72 10"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2 8C18 2 34 1 70 6"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </Link>
  );
}

function NavDivider() {
  return <span className="hidden h-10 w-px bg-line-2 lg:block" aria-hidden="true" />;
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const user = useAuthStore((s) => s.user);
  const showUserMenu = hydrated && isAuthenticated;
  const navLinks = NAV_LINKS.map((link) => {
    if (link.href !== '/courses') return link;
    const isLearner = !user?.role || user.role === 'user';
    if (showUserMenu && isLearner) {
      return { ...link, label: 'My Courses', href: myCoursesPath() };
    }
    return link;
  });

  const openSearch = () => {
    setMobileOpen(false);
    setSearchOpen(true);
  };

  return (
    <>
      <NavbarSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      <header className="sticky top-0 z-50 border-b border-line/50 bg-[var(--marketing-nav)] backdrop-blur-md backdrop-saturate-150">
        <Container className="flex h-[88px] items-center gap-6">
          <FiStudyLogo />

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <nav className="mr-4 flex items-center gap-6 xl:mr-6 xl:gap-8" aria-label="Main navigation">
              {navLinks.map((link) =>
                link.href.startsWith('/') ? (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-[16px] font-medium capitalize text-ink transition-colors hover:text-primary xl:text-[18px]"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-[16px] font-medium capitalize text-ink transition-colors hover:text-primary xl:text-[18px]"
                  >
                    {link.label}
                  </a>
                ),
              )}
            </nav>

            <NavDivider />

            <button
              type="button"
              aria-label="Search"
              aria-expanded={searchOpen}
              onClick={openSearch}
              className="text-primary transition-colors hover:text-primary-dark"
            >
              <Search className="size-[22px]" strokeWidth={2} />
            </button>

            <NavDivider />

            <LanguageSelector compact />

            <NavDivider />

            <ThemeToggle />

            <NavDivider />

            {showUserMenu ? <NavbarUserMenu /> : <NavbarAuthLinks />}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              aria-label="Search"
              onClick={openSearch}
              className="grid size-10 place-items-center text-primary"
            >
              <Search className="size-5" />
            </button>
            <button
              type="button"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen((v) => !v)}
              className="grid size-10 place-items-center rounded-lg border border-line text-ink-2"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </Container>

        {mobileOpen ? (
          <nav className="border-t border-line bg-bg-elev px-4 py-4 lg:hidden">
            {navLinks.map((link) =>
              link.href.startsWith('/') ? (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block border-b border-bg-soft py-3 text-[15px] font-medium capitalize text-ink"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block border-b border-bg-soft py-3 text-[15px] font-medium capitalize text-ink"
                >
                  {link.label}
                </a>
              ),
            )}

            <button
              type="button"
              onClick={openSearch}
              className="mt-4 flex w-full items-center gap-3 rounded-xl border border-line bg-bg-soft px-4 py-3 text-left text-sm font-medium text-ink-2"
            >
              <Search className="size-4 text-primary" />
              Search courses, categories, pages…
            </button>

            <div className="mt-5 space-y-4 border-t border-line pt-5">
              <div className="flex items-center justify-between gap-3">
                <LanguageSelector />
                <ThemeToggle />
              </div>
              {showUserMenu ? (
                <NavbarUserMenu compact />
              ) : (
                <Link href="/login" className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full border border-line-2">
                    <UserRound className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-ink">Sign in</span>
                    <span className="block text-xs text-ink-3">Register</span>
                  </span>
                </Link>
              )}
            </div>
          </nav>
        ) : null}
      </header>
    </>
  );
}
