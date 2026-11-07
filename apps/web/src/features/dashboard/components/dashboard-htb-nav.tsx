"use client";

import {
  BarChart3,
  Home,
  LayoutGrid,
  Settings,
  Trophy,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LabpathLogo } from "@/components/brand/labpath-logo";
import { brand } from "@/config/brand";
import { workspaceContests, workspacePractice, workspaceRanking } from "@/config/product-nav";
import { routes } from "@/config/routes";
import { DashboardNavApps } from "@/features/dashboard/components/dashboard-nav-apps";
import { DashboardNavHelp } from "@/features/dashboard/components/dashboard-nav-help";
import { DashboardNavNotifications } from "@/features/dashboard/components/dashboard-nav-notifications";
import { DashboardNavUserMenu } from "@/features/dashboard/components/dashboard-nav-user-menu";
import type { User as AppUser } from "@/types/user";

type DashboardHtbNavProps = {
  user: AppUser;
};

export function DashboardHtbNav({ user }: DashboardHtbNavProps) {
  const pathname = usePathname();
  const homeActive = pathname === routes.dashboard;
  const profileActive =
    pathname === routes.dashboardProfile || pathname.startsWith(`${routes.dashboardProfile}/`);
  const settingsActive =
    pathname === routes.dashboardSettings || pathname.startsWith(`${routes.dashboardSettings}/`);
  const labsActive = pathname === routes.practiceHub;
  const contestsActive =
    pathname === routes.contestHub || pathname.startsWith("/events/");
  const rankingActive =
    pathname === routes.dashboardRanking ||
    pathname.startsWith(`${routes.dashboardRanking}/`);

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
            href={workspacePractice.href}
            className={`lp-dash-htb-nav-link${labsActive ? " is-active" : ""}`}
          >
            <LayoutGrid {...navIconProps} />
            {workspacePractice.label}
          </Link>
          <Link
            href={workspaceContests.href}
            className={`lp-dash-htb-nav-link${contestsActive ? " is-active" : ""}`}
          >
            <Trophy {...navIconProps} />
            {workspaceContests.label}
          </Link>
          <Link
            href={workspaceRanking.href}
            className={`lp-dash-htb-nav-link${rankingActive ? " is-active" : ""}`}
          >
            <BarChart3 {...navIconProps} />
            {workspaceRanking.label}
          </Link>
          </nav>
        </div>

        <div className="lp-dash-htb-nav-actions">
          <DashboardNavNotifications />
          <DashboardNavHelp className="max-md:hidden" />
          <DashboardNavApps className="max-lg:hidden" />
          <DashboardNavUserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
