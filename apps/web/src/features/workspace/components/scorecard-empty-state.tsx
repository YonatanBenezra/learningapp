"use client";

import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

type ScorecardEmptyStateProps = {
  title?: string;
  lead: string;
  shortcutLabel?: string | null;
  /** Replaces the default shield icon. */
  icon?: ReactNode;
  /** Extra line under the lead (e.g. the run's error message). */
  detail?: string | null;
  /** Announce the state (failed runs). */
  alert?: boolean;
};

export function ScorecardEmptyState({
  title = "No runs yet",
  lead,
  shortcutLabel = "⌘ ↵ to submit",
  icon,
  detail,
  alert = false,
}: ScorecardEmptyStateProps) {
  return (
    <div className="lp-grd-score-empty" role={alert ? "alert" : undefined}>
      <div className="lp-grd-score-empty-frame">
        <span className="lp-grd-score-empty-icon" aria-hidden>
          {icon ?? <ShieldCheck strokeWidth={2.1} />}
        </span>
        <p className="lp-grd-score-empty-title">{title}</p>
        <p className="lp-grd-score-empty-lead">{lead}</p>
        {detail ? (
          <p
            className="lp-grd-score-empty-lead break-words font-mono"
            style={{ color: "var(--color-status-fail)" }}
          >
            {detail}
          </p>
        ) : null}
        {shortcutLabel ? (
          <span className="lp-grd-score-empty-kbd">{shortcutLabel}</span>
        ) : null}
      </div>
    </div>
  );
}
