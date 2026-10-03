"use client";

import { Activity } from "lucide-react";
import Link from "next/link";
import { routes } from "@/config/routes";
import { SIMULATOR_LABELS } from "@/config/simulators";
import type { Exercise } from "@/types/exercise";

type GuardrailsWorkspaceChromeProps = {
  exercise: Exercise;
  levelTitle: string;
  levelProgress?: number;
  levelCleared?: boolean;
  attempts: number;
  activeLevel?: number;
  liveMode?: boolean;
  tone?: "default" | "amber";
  showLivePill?: boolean;
  chromeMeta?: string;
};

export function GuardrailsWorkspaceChrome({
  exercise,
  levelTitle,
  levelProgress = 0.55,
  levelCleared = false,
  attempts,
  activeLevel = 1,
  liveMode = true,
  tone = "default",
  showLivePill = true,
  chromeMeta,
}: GuardrailsWorkspaceChromeProps) {
  return (
    <header className="lp-grd-chrome">
      <nav className="lp-grd-chrome-crumb" aria-label="Breadcrumb">
        <Link href={routes.problems}>Problems</Link>
        <span aria-hidden>/</span>
        <Link href={`${routes.problems}?track=guardrails`}>{SIMULATOR_LABELS.guardrails}</Link>
        <span aria-hidden>/</span>
        <span className="lp-grd-chrome-crumb-current">{exercise.title}</span>
      </nav>

      <div
        className={`lp-grd-chrome-progress${levelCleared ? " is-cleared" : ""}${tone === "amber" ? " is-amber" : ""}`}
        aria-live="polite"
      >
        <span
          className="lp-grd-chrome-progress-fill"
          style={{ width: `${Math.round(levelProgress * 100)}%` }}
          aria-hidden
        />
        <span className="lp-grd-chrome-progress-label">{levelTitle}</span>
      </div>

      <div className="lp-grd-chrome-actions">
        {chromeMeta ? (
          <span className="lp-grd-chrome-stat lp-grd-chrome-meta">{chromeMeta}</span>
        ) : (
          <span className="lp-grd-chrome-stat">
            <Activity className="size-3.5 shrink-0 opacity-80" strokeWidth={2.25} aria-hidden />
            Attempts: {attempts}
          </span>
        )}
        {showLivePill ? (
          liveMode ? (
            <span className="lp-grd-chrome-live-pill">
              <span className="lp-grd-chrome-dot" aria-hidden />
              Live · Level {activeLevel}
            </span>
          ) : (
            <span className="lp-grd-chrome-live-pill lp-grd-chrome-live-pill--muted">Practice</span>
          )
        ) : null}
        <Link href={routes.contests} className="lp-grd-chrome-link">
          Contest rules
        </Link>
      </div>
    </header>
  );
}
