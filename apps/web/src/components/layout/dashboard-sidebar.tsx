"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { brand } from "@/config/brand";
import { routes } from "@/config/routes";
import { ensureAuthSession } from "@/features/auth/auth-session";
import { LogoutButton } from "@/features/auth/logout-button";
import type { User } from "@/types/user";
import {
  BillingIcon,
  CatalogueIcon,
  ContestsIcon,
  LeaderboardIcon,
  PathsIcon,
  ProfileIcon,
  ProgressIcon,
} from "./dashboard-icons";

type NavItem = {
  href: string;
  label: string;
  icon: () => React.ReactElement;
};

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Account",
    items: [
      { href: routes.account, label: "Profile", icon: ProfileIcon },
      { href: routes.progress, label: "Progress", icon: ProgressIcon },
      { href: routes.billing, label: "Billing", icon: BillingIcon },
    ],
  },
  {
    title: "Practice",
    items: [
      { href: routes.catalogue, label: "Catalogue", icon: CatalogueIcon },
      { href: routes.paths, label: "Paths", icon: PathsIcon },
      { href: routes.contests, label: "Contests", icon: ContestsIcon },
      { href: routes.leaderboard, label: "Leaderboard", icon: LeaderboardIcon },
    ],
  },
];

type DashboardSidebarProps = {
  open: boolean;
  onClose: () => void;
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initialFor(user: User): string {
  const source = user.displayName?.trim() || user.email;
  return source.charAt(0).toUpperCase();
}

export function DashboardSidebar({ open, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  // Starts null on both server and client so the first paint matches.
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Resolves from the cached snapshot when RequireAuth already fetched it.
    ensureAuthSession().then((session) => {
      if (!cancelled && session.status === "authenticated") {
        setUser(session.user);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const tier = user?.account?.tier;

  return (
    <>
      <button
        type="button"
        className={`lp-dash-backdrop${open ? " is-open" : ""}`}
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <aside className={`lp-dash-sidebar${open ? " is-open" : ""}`} aria-label="Dashboard">
        <div className="lp-dash-brand">
          <Link href={routes.progress} className="lp-dash-brand-link" onClick={onClose}>
            <span className="lp-mark" aria-hidden="true">
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
            <span>
              <span className="lp-dash-brand-name">{brand.name}</span>
              <span className="lp-dash-brand-byline">Dashboard</span>
            </span>
          </Link>
        </div>

        <nav className="lp-dash-nav">
          {navGroups.map((group) => (
            <div key={group.title} className="lp-dash-group">
              <p className="lp-dash-group-title">{group.title}</p>
              <ul className="lp-dash-list">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`lp-dash-link${active ? " is-active" : ""}`}
                        aria-current={active ? "page" : undefined}
                        onClick={onClose}
                      >
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="lp-dash-sidebar-foot">
          {user ? (
            <div className="lp-dash-user">
              <span className="lp-dash-avatar" aria-hidden="true">
                {initialFor(user)}
              </span>
              <span className="lp-dash-user-text">
                <span className="lp-dash-user-name">
                  {user.displayName?.trim() || user.email.split("@")[0]}
                </span>
                <span className="lp-dash-user-mail" title={user.email}>
                  {user.email}
                </span>
              </span>
              {tier ? (
                <span className={`lp-dash-tier lp-dash-tier--${tier}`}>{tier}</span>
              ) : null}
            </div>
          ) : (
            <div className="lp-dash-user lp-dash-user--loading" aria-hidden="true">
              <span className="lp-dash-avatar" />
              <span className="lp-dash-user-text">
                <span className="lp-skel-line" />
                <span className="lp-skel-line" />
              </span>
            </div>
          )}

          <div className="lp-dash-foot-row">
            <Link href={routes.catalogue} className="lp-dash-foot-link" onClick={onClose}>
              Back to catalogue
            </Link>
            <LogoutButton className="lp-dash-foot-btn" onDone={onClose} />
          </div>
        </div>
      </aside>
    </>
  );
}
