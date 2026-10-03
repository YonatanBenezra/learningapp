"use client";

import { ShieldCheck } from "lucide-react";

type ScorecardEmptyStateProps = {
  title?: string;
  lead: string;
  shortcutLabel?: string;
};

export function ScorecardEmptyState({
  title = "No runs yet",
  lead,
  shortcutLabel = "⌘ ↵ to submit",
}: ScorecardEmptyStateProps) {
  return (
    <div className="lp-grd-score-empty">
      <div className="lp-grd-score-empty-frame">
        <span className="lp-grd-score-empty-icon" aria-hidden>
          <ShieldCheck strokeWidth={2.1} />
        </span>
        <p className="lp-grd-score-empty-title">{title}</p>
        <p className="lp-grd-score-empty-lead">{lead}</p>
        {shortcutLabel ? (
          <span className="lp-grd-score-empty-kbd">{shortcutLabel}</span>
        ) : null}
      </div>
    </div>
  );
}
