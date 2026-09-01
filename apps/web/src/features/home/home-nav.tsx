"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { brand } from "@/config/brand";
import { routes } from "@/config/routes";
import { AuthLink } from "@/features/auth/auth-link";

const links = [
  { href: routes.home, label: "Home" },
  { href: routes.catalogue, label: "Catalogue" },
  { href: routes.leaderboard, label: "Leaderboard" },
  { href: routes.contests, label: "Contests" },
  { href: routes.paths, label: "Paths" },
  { href: routes.progress, label: "Progress" },
  { href: routes.billing, label: "Billing" },
  { href: routes.login, label: "Sign in" },
];

export function HomeNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className={`ag-header${open ? " is-open" : ""}`}>
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
        <div className="ag-menu-cell">
          <button
            type="button"
            className="ag-menu-btn"
            aria-expanded={open}
            aria-controls="ag-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        <div className="ag-nav-cta">
          <AuthLink href={routes.catalogue} className="ag-btn ag-btn-sm ag-btn-dark">
            Get Started
          </AuthLink>
        </div>
      </div>
      {open ? (
        <nav id="ag-menu" className="ag-overlay" aria-label="Page">
          {links.map((item) => {
            const LinkTag =
              item.href === routes.catalogue ||
              item.href === routes.paths ||
              item.href === routes.contests ||
              item.href === routes.progress ||
              item.href === routes.billing
                ? AuthLink
                : Link;
            return (
              <LinkTag
                key={item.href}
                href={item.href}
                className="ag-overlay-link"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </LinkTag>
            );
          })}
          <div className="ag-overlay-meta">
            <div className="ag-socials" aria-hidden="true">
              <span className="ag-dot" />
              <span className="ag-dot" />
              <span className="ag-dot" />
              <span className="ag-dot" />
            </div>
            <p>© 2026 {brand.name}</p>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
