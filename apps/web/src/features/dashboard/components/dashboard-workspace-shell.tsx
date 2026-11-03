"use client";

import type { ReactNode } from "react";
import "@/features/dashboard/dashboard-figma.css";
import { DashboardHtbNav } from "@/features/dashboard/components/dashboard-htb-nav";
import type { User } from "@/types/user";

type DashboardWorkspaceShellProps = {
  user: User;
  children: ReactNode;
};

export function DashboardWorkspaceShell({ user, children }: DashboardWorkspaceShellProps) {
  return (
    <div className="lp-dash-figma lp-dash-figma--htb min-h-screen bg-[#101927]">
      <DashboardHtbNav user={user} />
      {children}
    </div>
  );
}
