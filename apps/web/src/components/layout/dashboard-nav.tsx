"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { brand } from "@/config/brand";
import { routes } from "@/config/routes";
import { authApi } from "@/features/auth/auth-api";
import {
  ensureAuthSession,
  getAuthSnapshot,
} from "@/features/auth/auth-session";
import { cn } from "@/lib/utils";
import type { User } from "@/types/user";
import "./dashboard-nav.css";

const navLinks = [
  { href: routes.problems, label: "Problems" },
  { href: routes.contests, label: "Contest" },
  { href: routes.leaderboard, label: "Leaderboard" },
  { href: routes.simulations, label: "Simulators" },
] as const;

const navLinkBase =
  "relative inline-flex h-full items-center whitespace-nowrap px-0.5 text-[0.875rem] font-medium text-lp-muted no-underline transition-colors hover:text-lp-ink";

const navLinkActive =
  "font-semibold text-lp-ink after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-none after:bg-lp-brand after:shadow-[0_0_10px_color-mix(in_srgb,var(--color-brand)_65%,transparent)] after:content-['']";

const avatarClass =
  "grid size-8 shrink-0 place-items-center rounded-full border border-lp-border bg-[color-mix(in_srgb,var(--color-bg)_90%,var(--color-card))] text-[0.6875rem] font-bold tracking-wide text-lp-brand no-underline";

function isSignedInStatus(status: string) {
  return status === "authenticated" || status === "soft";
}

function isActive(pathname: string, href: string) {
  if (href.includes("#")) {
    return false;
  }
  if (href === routes.problems) {
    return (
      pathname === routes.problems ||
      pathname.startsWith("/exercises/") ||
      pathname.startsWith("/demo/") ||
      pathname.startsWith("/runs/")
    );
  }
  if (href === routes.contests) {
    return pathname === routes.contests || pathname.startsWith("/contests/");
  }
  if (href === routes.simulations) {
    return pathname === routes.simulations || pathname.startsWith(`${routes.simulations}/`);
  }
  if (href === routes.leaderboard) {
    return pathname === routes.leaderboard;
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

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const cached = getAuthSnapshot();
  const searchRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [signedIn, setSignedIn] = useState(isSignedInStatus(cached.status));

  useEffect(() => {
    document.documentElement.dataset.workspace = "dashboard";
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

  function onSearch(event: FormEvent) {
    event.preventDefault();
    router.push(routes.problems);
  }

  const avatarLabel = userInitials(user);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-55 box-border border-b border-lp-border bg-lp-elevated",
        "pt-[env(safe-area-inset-top,0px)]",
      )}
    >
      <div
        className={cn(
          "lp-dash-nav-inner mx-auto box-border flex h-(--lp-dash-nav-h,3.25rem) w-full max-w-[1350px] items-center justify-between gap-2 px-6",
          "max-[899px]:gap-2 max-[899px]:px-4",
        )}
      >
        <div className="flex h-full min-w-0 items-center gap-5 max-[899px]:gap-3">
          <Link
            href={routes.home}
            className="flex shrink-0 items-center gap-2 no-underline"
            aria-label={brand.name}
          >
            <span
              className={cn(
                "grid size-7 place-items-center rounded-[0.35rem] text-white",
                "bg-linear-to-br from-lp-brand-hover to-lp-brand",
                "shadow-[0_2px_10px_color-mix(in_srgb,var(--color-brand)_35%,transparent)]",
              )}
              aria-hidden
            >
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
                <path
                  d="M5 6.5h6.2L7.8 13.5H14"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="text-[1rem] font-bold tracking-tight leading-tight text-lp-ink">
              {brand.name}
            </span>
          </Link>

          <nav
            className="flex h-full items-stretch gap-[1.15rem] max-[899px]:hidden"
            aria-label="Main"
          >
            {navLinks.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(navLinkBase, active && navLinkActive)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex h-full shrink-0 items-center gap-2">
          <form
            className={cn(
              "flex min-w-0 max-w-54 items-center gap-1.5 rounded-full border border-lp-border px-3 py-1.5",
              "w-54 bg-[color-mix(in_srgb,var(--color-bg)_88%,var(--color-card))]",
              "max-[899px]:w-40 max-sm:w-30",
            )}
            onSubmit={onSearch}
          >
            <svg
              className="shrink-0 text-lp-muted"
              viewBox="0 0 24 24"
              width="17"
              height="17"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M16 16l4.5 4.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search problems"
              aria-label="Search problems"
              className="min-w-0 flex-1 border-0 bg-transparent text-[0.875rem] text-lp-ink outline-none placeholder:text-lp-muted"
            />
            <kbd
              className={cn(
                "shrink-0 rounded border border-lp-border px-1 py-0.5",
                "bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)] font-mono text-[0.6875rem] font-semibold text-lp-muted",
              )}
              aria-hidden
            >
              /
            </kbd>
          </form>

          <Link
            href={routes.dashboard}
            className={cn(
              "inline-flex min-h-8 items-center rounded-full bg-lp-brand px-3.5 py-1.5",
              "text-[0.875rem] font-semibold whitespace-nowrap text-lp-brand-on no-underline",
              "transition-colors hover:bg-lp-brand-hover max-[899px]:hidden",
            )}
          >
            Dashboard
          </Link>

          {signedIn && user ? (
            <Link
              href={routes.progress}
              className={avatarClass}
              aria-label="Your profile"
              title={user.displayName ?? user.email}
            >
              {avatarLabel}
            </Link>
          ) : (
            <Link href={routes.login} className={avatarClass} title="Sign in">
              ?
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
