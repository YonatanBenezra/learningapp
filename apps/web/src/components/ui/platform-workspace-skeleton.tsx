"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import "@/features/dashboard/dashboard-figma.css";
import { SkeletonBlock } from "@/components/ui/skeleton-block";

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
    <div className="lp-dash-figma lp-dash-figma-skel" aria-busy="true" aria-label={label}>
      <div className="lp-dash-figma-main">{children}</div>
    </div>
  );
}
