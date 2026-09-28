"use client";

import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

type WorkTab = "configure" | "lab";

type WorkspaceWorkTabsProps = {
  tab: WorkTab;
  onTabChange: (tab: WorkTab) => void;
  editedSinceRun?: boolean;
};

export function WorkspaceWorkTabs({
  tab,
  onTabChange,
  editedSinceRun = true,
}: WorkspaceWorkTabsProps) {
  return (
    <div
      className="flex shrink-0 items-center justify-between gap-3 border-b border-lp-border px-3 py-2"
      role="tablist"
      aria-label="Workspace mode"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "configure"}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[0.8125rem] font-semibold transition-colors",
            tab === "configure"
              ? "border-lp-brand/50 bg-[color-mix(in_srgb,var(--color-brand)_10%,var(--color-card))] text-lp-ink shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-brand)_25%,transparent)]"
              : "border-transparent bg-transparent text-lp-muted hover:text-lp-ink",
          )}
          onClick={() => onTabChange("configure")}
        >
          <span className="font-mono text-[0.75rem] text-lp-brand" aria-hidden>
            {"<>"}
          </span>
          Submission
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "lab"}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[0.8125rem] font-medium transition-colors",
            tab === "lab"
              ? "text-lp-ink"
              : "text-lp-muted hover:text-lp-ink",
          )}
          onClick={() => onTabChange("lab")}
        >
          <FlaskConical className="size-3.5 opacity-70" aria-hidden />
          Simulation Lab
        </button>
      </div>
      {editedSinceRun && tab === "configure" ? (
        <p className="flex items-center gap-1.5 text-[0.6875rem] font-medium text-amber-400/90">
          <span className="size-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
          Edited since last run
        </p>
      ) : null}
    </div>
  );
}
