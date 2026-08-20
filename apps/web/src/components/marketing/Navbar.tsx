'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Search, X } from 'lucide-react';
import { LanguageSelector } from '@/src/components/layout/LanguageSelector';
import { ThemeToggle } from '@/src/components/ui/theme-toggle';
import { NavbarAuthLinks, NavbarUserMenu } from '@/src/components/marketing/NavbarUserMenu';
import { NavbarSearchOverlay } from '@/src/components/marketing/NavbarSearchOverlay';
import { useAuthHydrated } from '@/src/features/auth/useAuthHydrated';
import { useAuthStore } from '@/src/store/authStore';
import { cn } from '@/src/lib/utils';
import { APP_NAME } from '@/src/lib/brand';
import { BrandWordmark, LabPathMark } from '@/src/components/ui/brand-wordmark';
import { useTranslation, useIsRtl, useMarketingNavLinks } from '@/src/i18n';
import { Container } from './Container';

type NavLinkItem = ReturnType<typeof useMarketingNavLinks>[number];

function LabPathLogo() {
  return (
    <Link
      href="/"
      className="group inline-flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      aria-label={`${APP_NAME} home`}
      onClick={() => {
        if (window.location.pathname === '/') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }}
    >
      <LabPathMark size="sm" />
      <BrandWordmark size="sm" className="text-[17px] font-semibold sm:text-lg" />
    </Link>
  );
}

function NavLink({
  link,
  active,
  onNavigate,
  variant = 'desktop',
}: {
  link: NavLinkItem;
  active: boolean;
  onNavigate?: () => void;
  variant?: 'desktop' | 'drawer';
}) {
  const isDrawer = variant === 'drawer';
  const classes = isDrawer
    ? cn(
        'flex items-center rounded-lg px-3 py-2.5 text-base font-medium transition-colors',
        active ? 'bg-primary-soft text-primary' : 'text-ink-2 hover:bg-bg-soft hover:text-ink',
      )
    : cn(
        'rounded-full px-4 py-2 text-base font-medium transition-colors',
        active ? 'bg-primary-soft text-primary' : 'text-ink-2 hover:bg-bg-soft hover:text-ink',
      );

  const handleClick = () => {
    onNavigate?.();
  };

  return (
    <Link href={link.href} onClick={handleClick} className={classes}>
      {link.label}
    </Link>
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
      className="grid size-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-bg-elev hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      {children}
    </button>
  );
}

function useFocusTrap(active: boolean, containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!active || !containerRef.current) return;
    const root = containerRef.current;

    function focusable() {
      return Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1);
    }

    const first = focusable()[0];
    first?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (items.length === 0) return;
      const start = items[0];
      const end = items[items.length - 1];
      if (event.shiftKey && document.activeElement === start) {
        event.preventDefault();
        end.focus();
      } else if (!event.shiftKey && document.activeElement === end) {
        event.preventDefault();
        start.focus();
      }
    }

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, containerRef]);
}

function subscribeWindowScroll(onStoreChange: () => void) {
  window.addEventListener('scroll', onStoreChange, { passive: true });
  return () => window.removeEventListener('scroll', onStoreChange);
}

function getWindowScrollY() {
  return window.scrollY;
}

function getServerScrollY() {
  return 0;
}

function subscribeMedia(onStoreChange: () => void) {
  window.addEventListener('resize', onStoreChange);
  return () => window.removeEventListener('resize', onStoreChange);
}

function getIsMac() {
  return /Mac|iPhone|iPad/.test(navigator.platform) || navigator.userAgent.includes('Mac');
}

function getServerIsMac() {
  return false;
}

export function Navbar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const navLinks = useMarketingNavLinks();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const showUserMenu = hydrated && isAuthenticated;
  const drawerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [navPathname, setNavPathname] = useState(pathname);
  const isHome = pathname === '/';
  const scrollY = useSyncExternalStore(subscribeWindowScroll, getWindowScrollY, getServerScrollY);
  const isMac = useSyncExternalStore(subscribeMedia, getIsMac, getServerIsMac);
  const scrolled = !isHome || scrollY > 12;

  if (navPathname !== pathname) {
    setNavPathname(pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  useFocusTrap(mobileOpen, drawerRef);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const openSearch = () => {
    setMobileOpen(false);
    setSearchOpen(true);
  };

  useEffect(() => {
    function isEditableTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false;
      return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
    }

    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((open) => !open);
        setMobileOpen(false);
        return;
      }

      if (event.key === 'Escape' && !isEditableTarget(event.target)) {
        setMobileOpen(false);
      }
    }

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
    };
  }, [mobileOpen]);

  const searchShortcut = isMac ? t('navbarExtra.searchShortcutMac') : t('navbarExtra.searchShortcutWin');
  const drawerOffscreen = isRtl ? '-100%' : '100%';

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-[80] focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-ink"
      >
        {t('navbarExtra.skipToContent')}
      </a>

      <NavbarSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      <header
        className={cn(
          'sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-200',
          scrolled
            ? 'border-b border-line/60 bg-bg-elev/80 backdrop-blur-xl supports-[backdrop-filter]:bg-bg-elev/72'
            : 'border-b border-transparent bg-transparent',
        )}
      >
        <Container className="flex h-16 items-center gap-3 lg:gap-6">
          <LabPathLogo />

          <nav
            className="ml-2 hidden flex-1 items-center justify-center gap-0.5 lg:ml-6 lg:flex"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => (
              <NavLink key={link.href} link={link} active={isActive(link.href)} />
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-2.5 lg:flex">
            <button
              type="button"
              onClick={openSearch}
              aria-label={t('marketing.searchAria')}
              aria-expanded={searchOpen}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-line/80 bg-bg-soft/70 px-3 text-sm text-ink-3 transition-colors hover:border-line hover:bg-bg-elev hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              <Search className="size-3.5 shrink-0" strokeWidth={2} />
              <span className="hidden xl:inline">{t('marketing.searchAria')}</span>
              <kbd className="ms-0.5 hidden rounded-md border border-line bg-bg-elev px-1.5 py-0.5 text-[10px] font-medium leading-none text-ink-3 xl:inline">
                {searchShortcut}
              </kbd>
            </button>

            <div className="flex items-center gap-0.5 rounded-full border border-line/80 bg-bg-soft/70 p-0.5">
              <LanguageSelector compact className="rounded-full border-0 bg-transparent hover:bg-bg-elev" />
              <ThemeToggle
                aria-label={t('navbarExtra.toggleTheme')}
                className="size-9 rounded-full border-0 bg-transparent hover:bg-bg-elev"
              />
            </div>

            {showUserMenu ? <NavbarUserMenu /> : <NavbarAuthLinks />}
          </div>

          <div className="ml-auto flex items-center gap-1.5 lg:hidden">
            <IconButton label={t('marketing.searchAria')} expanded={searchOpen} onClick={openSearch}>
              <Search className="size-[18px]" strokeWidth={2} />
            </IconButton>
            <button
              ref={menuButtonRef}
              type="button"
              aria-label={mobileOpen ? t('navbarExtra.closeMenu') : t('navbarExtra.openMenu')}
              aria-expanded={mobileOpen}
              aria-controls="marketing-mobile-nav"
              onClick={() => setMobileOpen((value) => !value)}
              className="grid size-9 place-items-center rounded-full border border-line/80 bg-bg-soft/80 text-ink-2 transition-colors hover:bg-bg-elev hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
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
              aria-label={t('navbarExtra.closeMenu')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-ink/20 backdrop-blur-[2px] lg:hidden"
              onClick={() => {
                setMobileOpen(false);
                menuButtonRef.current?.focus();
              }}
            />
            <motion.aside
              id="marketing-mobile-nav"
              ref={drawerRef}
              initial={{ x: drawerOffscreen }}
              animate={{ x: 0 }}
              exit={{ x: drawerOffscreen }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className={cn(
                'fixed inset-y-0 z-[70] flex w-[min(100vw-2.5rem,320px)] flex-col bg-bg-elev lg:hidden',
                isRtl ? 'left-0 border-r border-line' : 'right-0 border-l border-line',
              )}
              aria-label="Mobile navigation"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-line/80 px-4 py-3">
                <LabPathLogo />
                <button
                  type="button"
                  aria-label={t('navbarExtra.closeMenu')}
                  onClick={() => {
                    setMobileOpen(false);
                    menuButtonRef.current?.focus();
                  }}
                  className="grid size-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-bg-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-3">
                <nav aria-label="Main navigation">
                  <ul className="space-y-0.5">
                    {navLinks.map((link) => (
                      <li key={link.href}>
                        <NavLink
                          link={link}
                          active={isActive(link.href)}
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
                  className="mt-3 flex w-full items-center gap-2.5 rounded-lg border border-line/80 bg-bg-soft/60 px-3 py-2.5 text-left text-sm text-ink-2 transition-colors hover:border-line hover:bg-bg-soft hover:text-ink"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
                    <Search className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{t('marketing.searchPagesPlaceholder')}</span>
                  <kbd className="rounded-md border border-line bg-bg-elev px-1.5 py-0.5 text-[10px] font-medium text-ink-3">
                    {searchShortcut}
                  </kbd>
                </button>

                <div className="mt-4 space-y-3 border-t border-line/80 pt-3">
                  <div className="flex items-center gap-2">
                    <LanguageSelector compact layout="drawer" className="min-w-0 flex-1" />
                    <ThemeToggle
                      aria-label={t('navbarExtra.toggleTheme')}
                      className="size-9 shrink-0 rounded-lg border border-line/80 bg-bg-elev"
                    />
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
