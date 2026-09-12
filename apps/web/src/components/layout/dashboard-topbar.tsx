"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { routes } from "@/config/routes";

const titles: { match: (pathname: string) => boolean; title: string; subtitle?: string }[] = [
  {
    match: (p) => p.startsWith("/profile"),
    title: "Profile",
    subtitle: "Public profile and display name",
  },
  {
    match: (p) => p.startsWith("/progress"),
    title: "Progress",
    subtitle: "Scores, attempts, and quota",
  },
  {
    match: (p) => p.startsWith("/billing"),
    title: "Billing",
    subtitle: "Plan and usage",
  },
];

type DashboardTopbarProps = {
  onMenuOpen: () => void;
};

export function DashboardTopbar({ onMenuOpen }: DashboardTopbarProps) {
  const pathname = usePathname();
  const meta = titles.find((item) => item.match(pathname)) ?? {
    title: "Dashboard",
    subtitle: undefined,
  };

  return (
    <header className="lp-dash-topbar">
      <div className="lp-dash-topbar-left">
        <button
          type="button"
          className="lp-dash-menu-btn"
          aria-label="Open menu"
          onClick={onMenuOpen}
        >
          <span />
          <span />
          <span />
        </button>
        <div>
          <h1 className="lp-dash-title">{meta.title}</h1>
          {meta.subtitle ? <p className="lp-dash-subtitle">{meta.subtitle}</p> : null}
        </div>
      </div>
      <div className="lp-dash-topbar-actions">
        <Link href={routes.catalogue} className="lp-btn lp-btn-primary lp-dash-top-cta">
          Open catalogue
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M6 3.5L10.5 8 6 12.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </header>
  );
}
