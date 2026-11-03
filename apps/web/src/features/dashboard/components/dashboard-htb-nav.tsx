"use client";

import {
  CircleHelp,
  Grid3X3,
  Home,
  LayoutGrid,
  Megaphone,
  Settings,
  Trophy,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LabpathLogo } from "@/components/brand/labpath-logo";
import { brand } from "@/config/brand";
import { routes } from "@/config/routes";
import { authUserInitials } from "@/features/auth/use-auth-session";
import type { User as AppUser } from "@/types/user";

type DashboardHtbNavProps = {
  user: AppUser;
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

export function DashboardHtbNav({ user }: DashboardHtbNavProps) {
  const pathname = usePathname();
  const homeActive = pathname === routes.dashboard;
  const profileActive =
    pathname === routes.dashboardProfile || pathname.startsWith(`${routes.dashboardProfile}/`);
  const settingsActive =
    pathname === routes.dashboardSettings || pathname.startsWith(`${routes.dashboardSettings}/`);
  const labsActive = pathname === routes.practiceHub;
  const contestsActive = pathname === routes.contestHub;

  const navIconProps = {
    className: "lp-dash-htb-nav-link-icon",
    strokeWidth: 2.15,
    "aria-hidden": true as const,
  };

  return (
    <header className="lp-dash-htb-nav">
      <div className="lp-dash-htb-nav-inner">
        <div className="lp-dash-htb-nav-start">
          <Link href={routes.home} className="lp-dash-htb-nav-brand" aria-label={brand.name}>
            <LabpathLogo size="sm" showWordmark wordmarkClassName="max-sm:hidden" />
          </Link>
          <span className="lp-dash-htb-nav-divider" aria-hidden />

          <nav className="lp-dash-htb-nav-center" aria-label="Dashboard workspace">
          <Link
            href={routes.dashboard}
            className={`lp-dash-htb-nav-link${homeActive ? " is-active" : ""}`}
          >
            <Home {...navIconProps} />
            Home
          </Link>
          <Link
            href={routes.dashboardProfile}
            className={`lp-dash-htb-nav-link${profileActive ? " is-active" : ""}`}
          >
            <User {...navIconProps} />
            Profile
          </Link>
          <Link
            href={routes.dashboardSettings}
            className={`lp-dash-htb-nav-link${settingsActive ? " is-active" : ""}`}
          >
            <Settings {...navIconProps} />
            Settings
          </Link>
          <Link
            href={routes.practiceHub}
            className={`lp-dash-htb-nav-link${labsActive ? " is-active" : ""}`}
          >
            <LayoutGrid {...navIconProps} />
            Labs
          </Link>
          <Link
            href={routes.contestHub}
            className={`lp-dash-htb-nav-link${contestsActive ? " is-active" : ""}`}
          >
            <Trophy {...navIconProps} />
            Contests
          </Link>
          </nav>
        </div>

        <div className="lp-dash-htb-nav-actions">
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
            <HexAvatar initials={authUserInitials(user)} />
          </Link>
        </div>
      </div>
    </header>
  );
}
