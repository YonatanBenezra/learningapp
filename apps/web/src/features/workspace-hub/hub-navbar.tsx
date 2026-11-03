"use client";

import {
  CircleHelp,
  Grid3X3,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LabpathLogo } from "@/components/brand/labpath-logo";
import { brand } from "@/config/brand";
import { routes } from "@/config/routes";
import { authUserInitials, useAuthSession } from "@/features/auth/use-auth-session";
import "@/features/dashboard/dashboard-figma.css";

export type HubNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
};

type HubNavbarProps = {
  hubHref: string;
  hubSuffix: string;
  ariaLabel: string;
  items: HubNavItem[];
  primaryAction?: ReactNode;
};

function HexAvatar({ initials }: { initials: string }) {
  return (
    <span className="lp-dash-htb-nav-hex" aria-hidden>
      <svg viewBox="0 0 40 40" className="h-10 w-10">
        <path
          d="M20 4l14 8v16l-14 8-14-8V12L20 4z"
          fill="#151F2E"
          stroke="#9FEF00"
          strokeWidth="1.5"
        />
      </svg>
      <span className="lp-dash-htb-nav-hex-text">{initials}</span>
    </span>
  );
}

const navIconProps = {
  className: "lp-dash-htb-nav-link-icon",
  strokeWidth: 2.15,
  "aria-hidden": true as const,
};

export function HubNavbar({ hubHref, hubSuffix, ariaLabel, items, primaryAction }: HubNavbarProps) {
  const pathname = usePathname();
  const { user } = useAuthSession();
  const initials = user ? authUserInitials(user) : "LP";

  return (
    <header className="lp-dash-htb-nav hub-nav-bar">
      <div className="lp-dash-htb-nav-inner">
        <div className="lp-dash-htb-nav-start">
          <Link href={hubHref} className="lp-dash-htb-nav-brand flex items-center gap-2" aria-label={brand.name}>
            <LabpathLogo size="sm" showWordmark wordmarkClassName="max-sm:hidden" />
            <span className="hub-nav-suffix hidden items-baseline font-normal text-platform-muted sm:inline-flex">
              {hubSuffix}
            </span>
          </Link>
          <span className="lp-dash-htb-nav-divider" aria-hidden />

          <nav className="lp-dash-htb-nav-center" aria-label={ariaLabel}>
            {items.map((item) => {
              const active = item.match ? item.match(pathname) : pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`lp-dash-htb-nav-link hub-nav-link${active ? " is-active" : ""}`}
                >
                  <Icon {...navIconProps} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="lp-dash-htb-nav-actions">
          {primaryAction}
          <button type="button" className="lp-dash-htb-nav-icon-btn" aria-label="Announcements">
            <Megaphone className="lp-dash-htb-nav-action-icon" strokeWidth={2.25} aria-hidden />
          </button>
          <button type="button" className="lp-dash-htb-nav-icon-btn max-md:hidden" aria-label="Help">
            <CircleHelp className="lp-dash-htb-nav-action-icon" strokeWidth={2.25} aria-hidden />
          </button>
          <button type="button" className="lp-dash-htb-nav-icon-btn max-lg:hidden" aria-label="Apps">
            <Grid3X3 className="lp-dash-htb-nav-action-icon" strokeWidth={2.25} aria-hidden />
          </button>
          <Link href={routes.dashboardProfile} className="lp-dash-htb-nav-user" aria-label="Account">
            <HexAvatar initials={initials} />
          </Link>
        </div>
      </div>
    </header>
  );
}
