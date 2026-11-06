"use client";

import {
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LabpathLogo } from "@/components/brand/labpath-logo";
import { brand } from "@/config/brand";
import { routes } from "@/config/routes";
import { useAuthSession } from "@/features/auth/use-auth-session";
import { DashboardNavApps } from "@/features/dashboard/components/dashboard-nav-apps";
import { DashboardNavHelp } from "@/features/dashboard/components/dashboard-nav-help";
import { DashboardNavNotifications } from "@/features/dashboard/components/dashboard-nav-notifications";
import { DashboardNavUserMenuSlot } from "@/features/dashboard/components/dashboard-nav-user-menu";
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

const navIconProps = {
  className: "lp-dash-htb-nav-link-icon",
  strokeWidth: 2.15,
  "aria-hidden": true as const,
};

export function HubNavbar({ hubHref, hubSuffix, ariaLabel, items, primaryAction }: HubNavbarProps) {
  const pathname = usePathname();
  const { user } = useAuthSession();

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
          <DashboardNavNotifications />
          <DashboardNavHelp className="max-md:hidden" />
          <DashboardNavApps className="max-lg:hidden" />
          <DashboardNavUserMenuSlot user={user} />
        </div>
      </div>
    </header>
  );
}
