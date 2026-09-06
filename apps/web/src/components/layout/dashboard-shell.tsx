"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopbar } from "./dashboard-topbar";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <div className="lp-dash">
      <DashboardSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lp-dash-main">
        <DashboardTopbar onMenuOpen={() => setMenuOpen(true)} />
        <main className="lp-dash-content">{children}</main>
      </div>
    </div>
  );
}
