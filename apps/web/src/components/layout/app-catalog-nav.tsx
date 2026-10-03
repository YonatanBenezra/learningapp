"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { NavbarMenu } from "@/components/aceternity/navbar-menu";
import { LabpathLogo } from "@/components/brand/labpath-logo";
import { brand } from "@/config/brand";
import { routes } from "@/config/routes";
import { authApi } from "@/features/auth/auth-api";
import {
  ensureAuthSession,
  getAuthSnapshot,
} from "@/features/auth/auth-session";
import type { User } from "@/types/user";

const navLinks = [
  { href: routes.dashboard, label: "Dashboard" },
  { href: routes.problems, label: "Problems" },
  { href: routes.contests, label: "Contest" },
  { href: routes.simulations, label: "Simulators" },
] as const;

function isSignedInStatus(status: string) {
  return status === "authenticated" || status === "soft";
}

function isActive(pathname: string, href: string) {
  if (href === routes.dashboard) {
    return pathname === routes.dashboard || pathname.startsWith(`${routes.dashboard}/`);
  }
  if (href === routes.problems) {
    return pathname === routes.problems;
  }
  if (href === routes.contests) {
    return pathname === routes.contests || pathname.startsWith("/contests/");
  }
  if (href === routes.simulations) {
    return pathname === routes.simulations || pathname.startsWith(`${routes.simulations}/`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function userInitials(user: User | null) {
  if (!user) {
    return "?";
  }
  const source = user.displayName?.trim() || user.email.split("@")[0] || "U";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function AppCatalogNav() {
  const pathname = usePathname();
  const router = useRouter();
  const cached = getAuthSnapshot();
  const searchRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [signedIn, setSignedIn] = useState(isSignedInStatus(cached.status));
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.workspace = "catalog";
    return () => {
      delete document.documentElement.dataset.workspace;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([ensureAuthSession(), authApi.me().catch(() => null)]).then(
      ([session, me]) => {
        if (cancelled) {
          return;
        }
        setSignedIn(isSignedInStatus(session.status));
        if (me) {
          setUser(me);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const q = search.trim();
    router.push(q ? `${routes.problems}?q=${encodeURIComponent(q)}` : routes.problems);
  }

  const menuItems = navLinks.map((item) => ({
    href: item.href,
    label: item.label,
    active: isActive(pathname, item.href),
  }));

  return (
    <header className="lp-site-nav lp-site-nav--catalog">
      <div className="lp-site-nav-glow" aria-hidden />
      <div className="lp-site-nav-inner lp-dash-nav-inner">
        <div className="lp-site-nav-left">
          <Link href={routes.home} className="lp-site-nav-brand" aria-label={brand.name}>
            <LabpathLogo size="md" showWordmark wordmarkClassName="max-[380px]:hidden" />
          </Link>

          <span className="lp-site-nav-vrule lp-site-nav-vrule--brand" aria-hidden />

          <div className="max-[899px]:hidden">
            <NavbarMenu items={menuItems} />
          </div>
        </div>

        <div className="lp-site-nav-right">
          <form className="lp-site-nav-search" onSubmit={onSearch}>
            <Search className="size-[1.125rem] shrink-0 text-lp-muted" strokeWidth={2} aria-hidden />
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search problems"
              aria-label="Search problems"
            />
            <kbd aria-hidden>/</kbd>
          </form>

          {signedIn && user ? (
            <Link
              href={routes.progress}
              className="lp-site-nav-avatar"
              aria-label="Your profile"
              title={user.displayName ?? user.email}
            >
              {userInitials(user)}
            </Link>
          ) : (
            <Link
              href={routes.login}
              className="lp-site-nav-signin rounded-lg shadow-none hover:shadow-none max-[520px]:hidden"
              title="Sign in"
            >
              Sign in
            </Link>
          )}

          <button
            type="button"
            className="lp-site-nav-menu-btn"
            aria-expanded={mobileNavOpen}
            aria-controls="lp-catalog-mobile-nav"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? (
              <X className="size-5" strokeWidth={2.25} aria-hidden />
            ) : (
              <Menu className="size-5" strokeWidth={2.25} aria-hidden />
            )}
          </button>
        </div>
      </div>

      <div
        id="lp-catalog-mobile-nav"
        className={`lp-site-nav-mobile${mobileNavOpen ? " is-open" : ""}`}
      >
        <NavbarMenu
          items={menuItems}
          className="lp-nav-menu--mobile"
          onNavigate={() => setMobileNavOpen(false)}
        />
        {!signedIn ? (
          <Link
            href={routes.login}
            className="lp-site-nav-signin mt-3 flex w-full justify-center rounded-lg shadow-none hover:shadow-none min-[520px]:hidden"
            onClick={() => setMobileNavOpen(false)}
          >
            Sign in
          </Link>
        ) : null}
      </div>
    </header>
  );
}

/** @deprecated Use AppCatalogNav */
export const DashboardNav = AppCatalogNav;
