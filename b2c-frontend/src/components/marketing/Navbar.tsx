'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
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
import { useTranslation, useMarketingNavLinks } from '@/src/i18n';
import { Container } from './Container';

type NavLinkItem = ReturnType<typeof useMarketingNavLinks>[number];

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
  variant = 'desktop',
}: {
  link: NavLinkItem;
  active: boolean;
  className?: string;
  onNavigate?: () => void;
  pathname: string;
  variant?: 'desktop' | 'drawer';
}) {
  const tourId = navTourId(link.href);
  const isDrawer = variant === 'drawer';
  const classes = cn(
    isDrawer
      ? cn(
          'flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors',
          active
            ? 'bg-primary-soft text-primary'
            : 'text-ink-2 hover:bg-bg-soft hover:text-ink',
        )
      : navLinkClass(active),
    className,
  );

  const content = isDrawer ? (
    link.label
  ) : (
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
  const { t } = useTranslation();
  const navLinks = useMarketingNavLinks();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const showUserMenu = hydrated && isAuthenticated;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const openSearch = () => {
    setMobileOpen(false);
    setSearchOpen(true);
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileOpen(false);
    }
    document.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
    };
  }, [mobileOpen]);

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
      </header>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-ink/20 backdrop-blur-[2px] lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="fixed inset-y-0 right-0 z-[70] flex w-[min(100vw-2rem,300px)] flex-col border-l border-line bg-bg-elev shadow-[0_0_40px_color-mix(in_srgb,var(--ink)_12%,transparent)] lg:hidden"
              aria-label="Mobile navigation"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-line/80 bg-gradient-to-r from-primary/[0.04] to-transparent px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary-2 text-primary-ink shadow-sm">
                    <Sparkles className="size-3.5" />
                  </span>
                  <BrandWordmark size="sm" className="font-semibold" />
                </div>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMobileOpen(false)}
                  className="grid size-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-bg-soft hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-3">
                <nav aria-label="Main navigation">
                  <ul className="space-y-1">
                    {navLinks.map((link) => (
                      <li key={link.label}>
                        <NavLink
                          link={link}
                          active={isActive(link.href)}
                          pathname={pathname}
                          variant="drawer"
                          onNavigate={() => setMobileOpen(false)}
                        />
                      </li>
                    ))}
                  </ul>
                </nav>

                <button
                  type="button"
                  onClick={openSearch}
                  className="mt-3 flex w-full items-center gap-2.5 rounded-xl border border-line/80 bg-bg-soft/60 px-3 py-2.5 text-left text-sm text-ink-2 transition-colors hover:border-line hover:bg-bg-soft hover:text-ink"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                    <Search className="size-3.5" />
                  </span>
                  <span className="truncate">{t('marketing.searchPagesPlaceholder')}</span>
                </button>

                <div className="mt-4 space-y-3 border-t border-line/80 pt-3">
                  <div className="flex items-center gap-2">
                    <LanguageSelector compact layout="drawer" className="min-w-0 flex-1" />
                    <ThemeToggle className="size-9 shrink-0 rounded-xl border border-line/80 bg-bg-elev/80" />
                  </div>

                  {showUserMenu ? (
                    <NavbarUserMenu compact drawer />
                  ) : (
                    <NavbarAuthLinks compact drawer onNavigate={() => setMobileOpen(false)} />
                  )}
                </div>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
