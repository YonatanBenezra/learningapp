"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, Menu, X } from "lucide-react";
import { NavbarMenu } from "@/components/aceternity/navbar-menu";
import { LabpathLogo } from "@/components/brand/labpath-logo";
import { brand } from "@/config/brand";
import { routes } from "@/config/routes";
import { CatalogNavHeaderAuth, CatalogNavAuth } from "@/components/layout/nav-auth-slot";
import { LiveEventPill } from "@/components/nav/LiveEventPill";
import { ThemeToggle } from "@/features/theme/theme-toggle";
import { cn } from "@/lib/utils";

const navLinks = [
  {
    href: routes.problems,
    label: "Problems",
    description: "20+ graded exercises",
  },
  {
    href: routes.contests,
    label: "Contest",
    description: "Timed sprints with live standings",
  },
  {
    href: routes.leaderboard,
    label: "Leaderboard",
    description: "Top scores this month",
  },
] as const;

function isActive(pathname: string, href: string) {
  if (href === routes.problems) {
    return pathname === routes.problems;
  }
  if (href === routes.contests) {
    return pathname === routes.contests || pathname.startsWith("/contests/");
  }
  if (href === routes.leaderboard) {
    return pathname === routes.leaderboard;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppCatalogNav() {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHome = pathname === routes.home;
  const isProblems = pathname === routes.problems;
  const isLeaderboard = pathname === routes.leaderboard;
  const isContests =
    pathname === routes.contests || pathname.startsWith("/contests/");
  useEffect(() => {
    document.documentElement.dataset.workspace = "catalog";
    return () => {
      delete document.documentElement.dataset.workspace;
    };
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  const menuItems = navLinks.map((item) => ({
    href: item.href,
    label: item.label,
    active: isActive(pathname, item.href),
  }));

  return (
    <header
      className={cn(
        "lp-site-nav lp-site-nav--catalog",
        isHome && "lp-site-nav--hero",
        isProblems && "lp-site-nav--problems",
        isLeaderboard && "lp-site-nav--leaderboard",
        isContests && "lp-site-nav--contests",
        (scrolled || isProblems || isLeaderboard) && "is-scrolled",
      )}
    >
      <div className="lp-site-nav-inner lp-dash-nav-inner">
        <div className="lp-site-nav-left">
          <Link href={routes.home} className="lp-site-nav-brand" aria-label={brand.name}>
            <LabpathLogo size="md" showWordmark wordmarkClassName="max-[380px]:hidden" />
          </Link>

          <div className="max-[899px]:hidden lp-site-nav-links">
            <NavbarMenu items={menuItems} />
          </div>
        </div>

        <div className="lp-site-nav-right">
          <LiveEventPill />
          <div className="max-[899px]:hidden">
            <ThemeToggle variant="nav" />
          </div>
          <span className="lp-site-nav-vrule lp-site-nav-vrule--actions max-[899px]:hidden" aria-hidden />

          <CatalogNavHeaderAuth />

          <button
            type="button"
            className="lp-site-nav-menu-btn"
            aria-expanded={mobileNavOpen}
            aria-controls="lp-catalog-mobile-nav"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? (
              <X className="lp-icon lp-icon--strong" strokeWidth={1.5} aria-hidden />
            ) : (
              <Menu className="lp-icon lp-icon--strong" strokeWidth={1.5} aria-hidden />
            )}
          </button>
        </div>
      </div>

      <div
        id="lp-catalog-mobile-nav"
        className={`lp-site-nav-mobile${mobileNavOpen ? " is-open" : ""}`}
      >
        <ul className="lp-site-nav-mobile-list">
          {navLinks.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`lp-site-nav-mobile-row${active ? " is-active" : ""}`}
                  onClick={() => setMobileNavOpen(false)}
                >
                  <span className="lp-site-nav-mobile-row-copy">
                    <span className="lp-site-nav-mobile-row-label">{item.label}</span>
                    <span className="lp-site-nav-mobile-row-desc">{item.description}</span>
                  </span>
                  <ChevronRight className="lp-icon lp-icon--muted" strokeWidth={1.5} aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="lp-site-nav-mobile-appearance">
          <span className="lp-site-nav-mobile-appearance-label">Appearance</span>
          <ThemeToggle variant="nav" />
        </div>

        <CatalogNavAuth variant="mobile" onNavigate={() => setMobileNavOpen(false)} />
      </div>
    </header>
  );
}

/** @deprecated Use AppCatalogNav */
export const DashboardNav = AppCatalogNav;
