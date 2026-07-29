'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, Sparkles, X } from 'lucide-react';
import { LanguageSelector } from '@/src/components/layout/LanguageSelector';
import { ThemeToggle } from '@/src/components/ui/theme-toggle';
import { NavbarAuthLinks, NavbarUserMenu } from '@/src/components/marketing/NavbarUserMenu';
import { NavbarSearchOverlay } from '@/src/components/marketing/NavbarSearchOverlay';
import { useAuthHydrated } from '@/src/features/auth/useAuthHydrated';
import { useAuthStore } from '@/src/store/authStore';
import { cn } from '@/src/lib/utils';
import { NAV_LINKS } from './data';
import { Container } from './Container';

function AIStudyLogo() {
  return (
    <Link
      href="/"
      className="inline-flex shrink-0 items-center gap-2.5"
      aria-label="AIStudy home"
    >
      <span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
        <Sparkles className="size-5" />
      </span>
      <span className="font-heading text-2xl font-semibold tracking-tight text-ink">
        <span className="text-primary">AI</span>
        Study
      </span>
    </Link>
  );
}

function navLinkClass(active: boolean) {
  return cn(
    'rounded-lg px-3.5 py-2.5 text-base font-medium transition-colors',
    active
      ? 'bg-primary-soft text-primary'
      : 'text-ink-2 hover:bg-bg-soft hover:text-ink',
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const showUserMenu = hydrated && isAuthenticated;

  const navLinks = NAV_LINKS;

  const isActive = (href: string) => {
    if (href === '#top') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const openSearch = () => {
    setMobileOpen(false);
    setSearchOpen(true);
  };

  return (
    <>
      <NavbarSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      <header className="sticky top-0 z-50 border-b border-line/80 bg-white/90 backdrop-blur-md dark:bg-[#151C2C]/90">
        <Container className="flex h-[80px] items-center gap-4">
          <AIStudyLogo />

          <nav
            className="ml-8 hidden flex-1 items-center gap-1 lg:flex"
            aria-label="Main navigation"
          >
            {navLinks.map((link) =>
              link.href.startsWith('/') ? (
                <Link
                  key={link.label}
                  href={link.href}
                  className={navLinkClass(isActive(link.href))}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className={navLinkClass(isActive(link.href))}
                >
                  {link.label}
                </a>
              ),
            )}
          </nav>

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <button
              type="button"
              aria-label="Search"
              aria-expanded={searchOpen}
              onClick={openSearch}
              className="grid size-10 place-items-center rounded-lg border border-transparent text-ink-2 transition-colors hover:border-line hover:bg-bg-soft hover:text-primary"
            >
              <Search className="size-[18px]" strokeWidth={2} />
            </button>

            <LanguageSelector compact />
            <ThemeToggle />

            {showUserMenu ? <NavbarUserMenu /> : <NavbarAuthLinks />}
          </div>

          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <button
              type="button"
              aria-label="Search"
              onClick={openSearch}
              className="grid size-10 place-items-center rounded-lg text-ink-2 hover:bg-bg-soft hover:text-primary"
            >
              <Search className="size-5" />
            </button>
            <button
              type="button"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen((v) => !v)}
              className="grid size-10 place-items-center rounded-lg border border-line text-ink-2 hover:bg-bg-soft"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </Container>

        {mobileOpen ? (
          <nav className="border-t border-line bg-bg-elev px-4 py-4 lg:hidden">
            <div className="space-y-1">
              {navLinks.map((link) =>
                link.href.startsWith('/') ? (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(navLinkClass(isActive(link.href)), 'block')}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(navLinkClass(isActive(link.href)), 'block')}
                  >
                    {link.label}
                  </a>
                ),
              )}
            </div>

            <button
              type="button"
              onClick={openSearch}
              className="mt-4 flex w-full items-center gap-3 rounded-lg border border-line bg-bg-soft px-4 py-3 text-left text-base font-medium text-ink-2"
            >
              <Search className="size-4 text-primary" />
              Search courses, pages…
            </button>

            <div className="mt-5 space-y-4 border-t border-line pt-5">
              <div className="flex items-center justify-between gap-3">
                <LanguageSelector />
                <ThemeToggle />
              </div>
              {showUserMenu ? (
                <NavbarUserMenu compact />
              ) : (
                <NavbarAuthLinks compact onNavigate={() => setMobileOpen(false)} />
              )}
            </div>
          </nav>
        ) : null}
      </header>
    </>
  );
}
