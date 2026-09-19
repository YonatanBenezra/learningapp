"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { brand } from "@/config/brand";
import { routes } from "@/config/routes";
import { authApi } from "@/features/auth/auth-api";
import {
  ensureAuthSession,
  getAuthSnapshot,
} from "@/features/auth/auth-session";
import { progressApi } from "@/features/progress/progress-api";
import { applyTheme, readTheme, type Theme } from "@/features/theme/theme";
import type { User } from "@/types/user";
import "./dashboard-nav.css";

const navLinks = [
  { href: routes.problems, label: "Problems" },
  { href: routes.contests, label: "Contest" },
  { href: `${routes.home}#ai-engineer`, label: "Simulators" },
] as const;

function isSignedInStatus(status: string) {
  return status === "authenticated" || status === "soft";
}

function isActive(pathname: string, href: string) {
  if (href.includes("#")) {
    return false;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function userInitial(user: User) {
  const source = user.displayName?.trim() || user.email;
  return source.charAt(0).toUpperCase();
}

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const cached = getAuthSnapshot();
  const [user, setUser] = useState<User | null>(null);
  const [streak, setStreak] = useState(0);
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
    Promise.all([
      ensureAuthSession(),
      authApi.me().catch(() => null),
      progressApi.getMine().catch(() => null),
    ]).then(([session, me, progress]) => {
      if (cancelled) {
        return;
      }
      setSignedIn(isSignedInStatus(session.status));
      if (me) {
        setUser(me);
      }
      if (progress) {
        setStreak(progress.streak.current);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    router.push(routes.problems);
  }

  function toggleTheme() {
    const next: Theme = readTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
  }

  return (
    <header className="lp-dash-nav">
      <div className="lp-dash-nav-inner">
        <div className="lp-dash-nav-left">
          <Link href={routes.home} className="lp-dash-nav-logo" aria-label={brand.name}>
            <span className="lp-dash-nav-mark" aria-hidden="true">
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
            <span className="lp-dash-nav-logo-name">{brand.name}</span>
          </Link>

          <nav className="lp-dash-nav-links" aria-label="Main">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`lp-dash-nav-link${isActive(pathname, item.href) ? " is-active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="lp-dash-nav-right">
          <form className="lp-dash-nav-search" onSubmit={onSearch}>
            <svg
              className="lp-dash-nav-search-icon"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              aria-label="Search problems"
            />
          </form>

          <Link
            href={routes.progress}
            className="lp-dash-nav-streak"
            title="Current streak"
            aria-label={`${streak} day streak`}
          >
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
              <path
                d="M8 2.5c.8 2.2 2.4 3.4 2.4 5.6a2.4 2.4 0 0 1-4.8 0C5.6 5.9 7.2 4.7 8 2.5Z"
                fill="#f97316"
              />
              <path
                d="M8 12.5c-2.2 0-4-1.2-4.8-3.1-.4 1.6.4 3.4 2 4.4 1.2.7 2.6.7 3.8 0 1.6-1 2.4-2.8 2-4.4-.8 1.9-2.6 3.1-4.8 3.1Z"
                fill="#fb923c"
              />
            </svg>
            <span>{streak}</span>
          </Link>

          <button
            type="button"
            className="lp-dash-nav-icon-btn"
            aria-label="Toggle color theme"
            title="Theme"
            onClick={toggleTheme}
          >
            <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="2.5" fill="currentColor" />
              <path
                d="M8 1.5v1.2M8 13.3v1.2M1.5 8h1.2M13.3 8h1.2M3.4 3.4l.85.85M11.75 11.75l.85.85M3.4 12.6l.85-.85M11.75 4.25l.85-.85"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {signedIn && user ? (
            <Link
              href={routes.progress}
              className="lp-dash-nav-avatar"
              aria-label="Your profile"
              title={user.displayName ?? user.email}
            >
              {userInitial(user)}
            </Link>
          ) : (
            <Link href={routes.login} className="lp-dash-nav-signin">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
