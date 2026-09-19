"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { brand } from "@/config/brand";
import { routes } from "@/config/routes";
import { AuthLink } from "@/features/auth/auth-link";
import {
  ensureAuthSession,
  getAuthSnapshot,
} from "@/features/auth/auth-session";

const navLinks = [
  { href: routes.problems, label: "Problems", auth: false },
  { href: routes.contests, label: "Contest", auth: false },
  { href: "#ai-engineer", label: "Simulators", auth: false },
] as const;

const NAV_COLLAPSE_MQ = "(max-width: 859px)";

function isSignedInStatus(status: string) {
  return status === "authenticated" || status === "soft";
}

function isActive(pathname: string, href: string) {
  if (href.startsWith("#")) {
    return false;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HomeNav() {
  const pathname = usePathname();
  const cached = getAuthSnapshot();
  const headerRef = useRef<HTMLElement>(null);
  const navId = useId();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (menuOpen) setHidden(false);
  }, [menuOpen]);

  useEffect(() => {
    const media = window.matchMedia(NAV_COLLAPSE_MQ);
    const onChange = () => {
      if (!media.matches) setMenuOpen(false);
    };
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [menuOpen]);

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
    hidden && !menuOpen ? "is-hidden" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header ref={headerRef} className={headerClass}>
      <div className={`ag-nav${menuOpen ? " is-open" : ""}`}>
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

        <div className="ag-nav-end">
          <nav className="ag-nav-links" id={navId} aria-label="Main">
            {navLinks.map((item) => {
              const LinkTag = item.auth ? AuthLink : Link;
              const active = isActive(pathname, item.href);
              return (
                <LinkTag
                  key={item.href}
                  href={item.href}
                  className={`ag-nav-link${active ? " is-active" : ""}`}
                >
                  {item.label}
                </LinkTag>
              );
            })}
          </nav>

          <div className="ag-nav-cta">
            <button
              type="button"
              className="ag-nav-toggle"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls={navId}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span />
              <span />
              <span />
            </button>
            {signedIn ? (
              <Link href={routes.progress} className="ag-nav-btn">
                Dashboard
              </Link>
            ) : (
              <Link
                href={routes.login}
                className={`ag-nav-btn${pathname === routes.login ? " is-active" : ""}`}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
