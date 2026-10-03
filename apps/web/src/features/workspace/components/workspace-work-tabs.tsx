"use client";

import { cn } from "@/lib/utils";
import { SimLabWireframeIcon } from "./sim-lab-wireframe-icon";

type WorkTab = "configure" | "lab";

type WorkspaceWorkTabsProps = {
  tab: WorkTab;
  onTabChange: (tab: WorkTab) => void;
  editedSinceRun?: boolean;
  showLab?: boolean;
  /** Figma RAG workspace — Submission / Simulation Lab wireframe tabs */
  figmaStyle?: boolean;
};

export function WorkspaceWorkTabs({
  tab,
  onTabChange,
  editedSinceRun = true,
  showLab = true,
  figmaStyle = false,
}: WorkspaceWorkTabsProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between gap-3 border-b border-lp-border px-3 py-2",
        figmaStyle && "lp-ws-figma-work-tabs border-b-0 px-4 pb-0 pt-3",
      )}
      role="tablist"
      aria-label="Workspace mode"
    >
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "configure"}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[0.8125rem] font-semibold transition-colors",
            figmaStyle
              ? tab === "configure"
                ? "border-lp-border bg-[color-mix(in_srgb,var(--lp-ink)_6%,var(--color-card))] text-lp-ink"
                : "border-transparent bg-transparent text-lp-muted"
              : tab === "configure"
                ? "border-lp-brand/50 bg-[color-mix(in_srgb,var(--color-brand)_10%,var(--color-card))] text-lp-ink shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-brand)_25%,transparent)]"
                : "border-transparent bg-transparent text-lp-muted hover:text-lp-ink",
          )}
          onClick={() => onTabChange("configure")}
        >
          <span
            className={cn(
              "font-mono text-[0.75rem]",
              figmaStyle ? "text-lp-muted" : "text-lp-brand",
            )}
            aria-hidden
          >
            {"<>"}
          </span>
          {figmaStyle ? "Submission" : "Submit"}
        </button>
        {showLab ? (
          <button
            type="button"
            role="tab"
            aria-selected={tab === "lab"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[0.8125rem] font-semibold transition-colors",
              figmaStyle
                ? tab === "lab"
                  ? "border-[color-mix(in_srgb,var(--lp-grd-teal,var(--color-brand))_45%,var(--lp-border))] bg-[color-mix(in_srgb,var(--lp-ink)_5%,var(--color-card))] text-lp-ink"
                  : "border-transparent bg-transparent text-lp-muted"
                : tab === "lab"
                  ? "text-lp-ink"
                  : "text-lp-muted hover:text-lp-ink",
            )}
            onClick={() => onTabChange("lab")}
          >
            {figmaStyle ? (
              <SimLabWireframeIcon className="text-[var(--lp-grd-teal,var(--color-brand))]" />
            ) : null}
            Simulation Lab
          </button>
        ) : null}
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
