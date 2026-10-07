"use client";

import type { ReactNode } from "react";
import { WorkspaceBackTab } from "@/components/layout/workspace-back-tab";

export function WorkspacePracticeFrame({ children }: { children: ReactNode }) {
  return (
    <>
      <WorkspaceBackTab />
      {children}
    </>
  );
}
