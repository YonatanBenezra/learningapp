"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { brand } from "@/config/brand";
import { routes } from "@/config/routes";
import { AuthLink } from "@/features/auth/auth-link";
import {
  ensureAuthSession,
  getAuthSnapshot,
} from "@/features/auth/auth-session";

const publicLinks = [
  { href: routes.home, label: "Home" },
  { href: routes.catalogue, label: "Catalogue" },
  { href: routes.leaderboard, label: "Leaderboard" },
  { href: routes.contests, label: "Contests" },
  { href: routes.paths, label: "Paths" },
];

const authHrefs = new Set<string>([
  routes.catalogue,
  routes.paths,
  routes.contests,
]);

function isSignedInStatus(status: string) {
  return status === "authenticated" || status === "soft";
}

export function HomeNav() {
  const cached = getAuthSnapshot();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [signedIn, setSignedIn] = useState(isSignedInStatus(cached.status));

  useEffect(() => {
    let cancelled = false;
    ensureAuthSession().then((session) => {
      if (!cancelled) {
        setSignedIn(isSignedInStatus(session.status));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const delta = y - lastY;

      setScrolled(y > 16);

      if (y < 48) {
        setHidden(false);
      } else if (delta > 6) {
        setHidden(true);
      } else if (delta < -6) {
        setHidden(false);
      }

      document.documentElement.style.setProperty(
        "--ag-scroll",
        String(Math.min(y / 600, 1)),
      );

      lastY = y;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.documentElement.style.removeProperty("--ag-scroll");
    };
  }, []);

  const headerClass = [
    "ag-header",
    scrolled ? "is-scrolled" : "",
    hidden ? "is-hidden" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const links = signedIn
    ? publicLinks
    : [...publicLinks, { href: routes.login, label: "Sign in" }];

  return (
    <header className={headerClass}>
      <div className="ag-nav">
        <Link href={routes.home} className="ag-logo">
          <span className="ag-mark" aria-hidden="true">
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
              <path
                d="M5 6.5h6.2L7.8 13.5H14"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="ag-logo-name">{brand.name}</span>
        </Link>
        <nav className="ag-nav-links" aria-label="Page">
          {links.map((item) => {
            const LinkTag = authHrefs.has(item.href) ? AuthLink : Link;
            return (
              <LinkTag key={item.href} href={item.href} className="ag-nav-link">
                {item.label}
              </LinkTag>
            );
          })}
        </nav>
        <div className="ag-nav-cta">
          {signedIn ? (
            <Link href={routes.progress} className="ag-btn ag-btn-sm ag-btn-orange">
              Dashboard
            </Link>
          ) : (
            <AuthLink href={routes.catalogue} className="ag-btn ag-btn-sm ag-btn-orange">
              Get Started
            </AuthLink>
          )}
        </div>
      </div>
    </header>
  );
}
