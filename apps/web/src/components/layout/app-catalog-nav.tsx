"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { NavbarMenu } from "@/components/aceternity/navbar-menu";
import { LabpathLogo } from "@/components/brand/labpath-logo";
import { brand } from "@/config/brand";
import { routes } from "@/config/routes";
import { CatalogNavAuth } from "@/components/layout/nav-auth-slot";

const navLinks = [
  { href: routes.problems, label: "Problems" },
  { href: routes.contests, label: "Contest" },
  { href: routes.leaderboard, label: "Leaderboard" },
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
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.workspace = "catalog";
    return () => {
      delete document.documentElement.dataset.workspace;
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

          <CatalogNavAuth variant="desktop" />

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
        <CatalogNavAuth
          variant="mobile"
          onNavigate={() => setMobileNavOpen(false)}
        />
      </div>
    </header>
  );
}

/** @deprecated Use AppCatalogNav */
export const DashboardNav = AppCatalogNav;
