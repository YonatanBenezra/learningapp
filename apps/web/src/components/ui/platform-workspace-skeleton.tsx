"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import "@/features/dashboard/dashboard-figma.css";
import { SkeletonBlock } from "@/components/ui/skeleton-block";

function NavLinkSkel({ w }: { w: number }) {
  return <SkeletonBlock width={w} height={36} style={{ borderRadius: 8 }} />;
}

type PlatformWorkspaceSkeletonProps = {
  children: ReactNode;
  /** Accessible name for the loading region */
  label?: string;
};

export function PlatformWorkspaceSkeleton({
  children,
  label = "Loading page",
}: PlatformWorkspaceSkeletonProps) {
  useEffect(() => {
    document.documentElement.dataset.workspace = "dashboard";
    return () => {
      delete document.documentElement.dataset.workspace;
    };
  }, []);

  return (
    <div
      className="lp-dash-figma lp-dash-figma--htb lp-dash-figma-skel min-h-screen bg-[#101927]"
      aria-busy="true"
      aria-label={label}
    >
      <header className="lp-dash-htb-nav">
        <div className="lp-dash-htb-nav-inner">
          <div className="lp-dash-htb-nav-start">
            <SkeletonBlock width={118} height={28} style={{ borderRadius: 6 }} />
            <span className="lp-dash-htb-nav-divider" aria-hidden />
            <nav className="lp-dash-htb-nav-center" aria-hidden>
              <NavLinkSkel w={88} />
              <NavLinkSkel w={92} />
              <NavLinkSkel w={72} />
              <NavLinkSkel w={100} />
            </nav>
          </div>
          <div className="lp-dash-htb-nav-actions">
            <SkeletonBlock width={40} height={40} style={{ borderRadius: 8 }} />
            <SkeletonBlock width={40} height={40} style={{ borderRadius: 8 }} className="max-md:hidden" />
            <SkeletonBlock width={40} height={40} style={{ borderRadius: 8 }} className="max-lg:hidden" />
            <SkeletonBlock width={40} height={40} circle />
          </div>
        </div>
      </header>

      <div className="lp-dash-figma-main">{children}</div>
    </div>
  );
}
