"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import "@/features/dashboard/dashboard-figma.css";
import { useAuthSession } from "@/features/auth/use-auth-session";
import { DashboardHtbNav } from "@/features/dashboard/components/dashboard-htb-nav";

type DashboardHtbShellProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Persistent HTB workspace chrome (top nav) for dashboard hub routes.
 * Keeps the navbar mounted across client navigations within the same layout segment.
 */
export function DashboardHtbShell({ children, className }: DashboardHtbShellProps) {
  const { user } = useAuthSession();

  return (
    <div
      className={cn("lp-dash-htb-workspace lp-dash-figma lp-dash-figma--htb min-h-screen", className)}
    >
      {user ? <DashboardHtbNav user={user} /> : <DashboardHtbNavPlaceholder />}
      {children}
    </div>
  );
}

/** Reserved nav height so layout does not jump before session resolves */
function DashboardHtbNavPlaceholder() {
  return (
    <header className="lp-dash-htb-nav" aria-hidden>
      <div
        className="lp-dash-htb-nav-inner pointer-events-none"
        style={{ minHeight: "var(--height-platform-topbar, 60px)" }}
      />
    </header>
  );
}
