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
import { APP_NAME } from '@/src/lib/brand';
import { BrandWordmark } from '@/src/components/ui/brand-wordmark';
import { NAV_LINKS } from './data';
import { Container } from './Container';

function LabPathLogo() {
  return (
    <Link
      href="/"
      className="group inline-flex shrink-0 items-center gap-2.5"
      aria-label={`${APP_NAME} home`}
    >
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-2 text-primary-ink shadow-[0_8px_20px_color-mix(in_srgb,var(--primary)_28%,transparent)] transition-transform group-hover:scale-[1.02]">
        <Sparkles className="size-4" />
      </span>
      <BrandWordmark size="md" />
    </Link>
  );
}

function navLinkClass(active: boolean) {
  return cn(
    'relative rounded-md px-3 py-2 text-base font-medium transition-colors',
    active ? 'text-primary' : 'text-ink-2 hover:text-ink',
  );
}

function navTourId(href: string): string {
  if (href === '/') return 'tour-nav-home';
  return `tour-nav-${href.slice(1)}`;
}

function NavLink({
  link,
  active,
  className,
  onNavigate,
  pathname,
}: {
  link: (typeof NAV_LINKS)[number];
  active: boolean;
  className?: string;
  onNavigate?: () => void;
  pathname: string;
}) {
  const tourId = navTourId(link.href);
  const classes = cn(navLinkClass(active), className);

  const content = (
    <>
      {link.label}
      {active ? (
        <span
          className="absolute inset-x-2 bottom-0.5 h-0.5 rounded-full bg-primary"
          aria-hidden="true"
        />
      ) : null}
    </>
  );

  const handleClick = () => {
    onNavigate?.();
    if (link.href === '/' && pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (link.href.startsWith('/')) {
    return (
      <Link href={link.href} data-tour={tourId} onClick={handleClick} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <a href={link.href} data-tour={tourId} onClick={onNavigate} className={classes}>
      {content}
    </a>
  );
}

function UtilityCluster({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-0.5 rounded-full border border-line/80 bg-bg-soft/70 p-0.5',
        className,
      )}
    >
      {children}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  expanded,
  children,
}: {
  label: string;
  onClick: () => void;
  expanded?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={expanded}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-bg-elev hover:text-ink"
    >
      {children}
    </button>
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
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const openSearch = () => {
    setMobileOpen(false);
    setSearchOpen(true);
  };

  return (
    <>
      <NavbarSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      <header className="sticky top-0 z-50 border-b border-line/70 bg-bg-elev/80 shadow-[0_1px_0_color-mix(in_srgb,var(--line)_70%,transparent),0_10px_30px_color-mix(in_srgb,var(--ink)_4%,transparent)] backdrop-blur-xl supports-[backdrop-filter]:bg-bg-elev/70">
        <Container className="flex h-16 items-center gap-3 lg:gap-6">
          <LabPathLogo />

          <nav
            className="ml-4 hidden flex-1 items-center justify-center gap-0.5 lg:ml-8 lg:flex"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => (
              <NavLink key={link.label} link={link} active={isActive(link.href)} pathname={pathname} />
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-3 lg:flex">
            <UtilityCluster>
              <IconButton label="Search" expanded={searchOpen} onClick={openSearch}>
                <Search className="size-[17px]" strokeWidth={2} />
              </IconButton>
              <LanguageSelector compact className="rounded-full border-0 bg-transparent hover:bg-bg-elev" />
              <ThemeToggle className="size-9 rounded-full border-0 bg-transparent hover:bg-bg-elev" />
            </UtilityCluster>

            {showUserMenu ? <NavbarUserMenu /> : <NavbarAuthLinks />}
          </div>

          <div className="ml-auto flex items-center gap-1.5 lg:hidden">
            <IconButton label="Search" onClick={openSearch}>
              <Search className="size-[18px]" strokeWidth={2} />
            </IconButton>
            <button
              type="button"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((value) => !value)}
              className="grid size-9 place-items-center rounded-full border border-line/80 bg-bg-soft/80 text-ink-2 transition-colors hover:bg-bg-elev hover:text-ink"
            >
              {mobileOpen ? <X className="size-[18px]" /> : <Menu className="size-[18px]" />}
            </button>
          </div>
        </Container>

        {mobileOpen ? (
          <>
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 top-16 z-40 bg-ink/15 backdrop-blur-[1px] lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <nav className="relative z-50 border-t border-line/80 bg-bg-elev/95 px-4 py-4 shadow-card backdrop-blur-xl lg:hidden">
              <div className="space-y-0.5">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.label}
                    link={link}
                    active={isActive(link.href)}
                    pathname={pathname}
                    className="block rounded-lg px-3 py-2.5"
                    onNavigate={() => setMobileOpen(false)}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={openSearch}
                className="mt-3 flex w-full items-center gap-3 rounded-xl border border-line bg-bg-soft/80 px-4 py-3 text-left text-sm font-medium text-ink-2 transition-colors hover:border-line-2 hover:text-ink"
              >
                <Search className="size-4 text-primary" />
                Search courses, pages…
              </button>

              <div className="mt-5 space-y-4 border-t border-line/80 pt-5">
                <UtilityCluster className="w-fit">
                  <LanguageSelector compact className="rounded-full border-0 bg-transparent hover:bg-bg-elev" />
                  <ThemeToggle className="size-9 rounded-full border-0 bg-transparent hover:bg-bg-elev" />
                </UtilityCluster>

                {showUserMenu ? (
                  <NavbarUserMenu compact />
                ) : (
                  <NavbarAuthLinks compact onNavigate={() => setMobileOpen(false)} />
                )}
              </div>
            </nav>
          </>
        ) : null}
      </header>
    </>
  );
}
