"use client";

import { useCallback, useEffect } from "react";
import { ArrowRight, Copy, Flag } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { routes } from "@/config/routes";
import { formatOperationElapsed } from "@/features/contests/contest-elapsed";
import { cn } from "@/lib/utils";
import "../flag-captured.css";

export type FlagCapturedPayload = {
  contestSlug: string;
  exerciseSlug: string;
  challengeTitle: string;
  pointsEarned: number;
  flagToken: string;
  rank: number | null;
  rankDelta: number | null;
  flagsSolved: number;
  flagsTotal: number;
  elapsedMs: number;
  nextExerciseSlug: string | null;
};

export function FlagCapturedModal({
  open,
  payload,
  onClose,
}: {
  open: boolean;
  payload: FlagCapturedPayload | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const copyFlag = useCallback(async () => {
    if (!payload?.flagToken) {
      return;
    }
    try {
      await navigator.clipboard.writeText(payload.flagToken);
      toast.success("Flag copied");
    } catch {
      toast.error("Could not copy");
    }
  }, [payload?.flagToken]);

  if (!open || !payload) {
    return null;
  }

  const nextHref = payload.nextExerciseSlug
    ? routes.contestProblem(payload.contestSlug, payload.nextExerciseSlug)
    : routes.contestPlay(payload.contestSlug);
  const nextLabel = payload.nextExerciseSlug ? "Next challenge" : "Back to board";

  return (
    <div className="lp-flag-cap-overlay" role="presentation" onClick={onClose}>
      <dialog
        open
        className="lp-flag-cap-dialog"
        aria-labelledby="flag-cap-title"
        aria-describedby="flag-cap-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lp-flag-cap-glow" aria-hidden />
        <header className="lp-flag-cap-head">
          <span className="lp-flag-cap-icon" aria-hidden>
            <Flag className="size-5" strokeWidth={2.5} />
          </span>
          <p className="lp-flag-cap-kicker">Flag captured</p>
          <h2 id="flag-cap-title" className="lp-flag-cap-points">
            +{payload.pointsEarned.toLocaleString()} pts
          </h2>
          <p id="flag-cap-desc" className="lp-flag-cap-sub">
            {payload.challengeTitle}
          </p>
        </header>

        <div className="lp-flag-cap-token">
          <code className="lp-flag-cap-token-text">{payload.flagToken}</code>
          <button
            type="button"
            className="lp-flag-cap-copy"
            aria-label="Copy flag"
            onClick={() => void copyFlag()}
          >
            <Copy className="size-4" aria-hidden />
          </button>
        </div>

        <dl className="lp-flag-cap-stats">
          <div>
            <dt>Rank</dt>
            <dd>
              {payload.rank != null ? `#${payload.rank}` : "—"}
              {payload.rankDelta != null && payload.rankDelta > 0 ? (
                <span className="lp-flag-cap-rank-up" aria-label={`Up ${payload.rankDelta} places`}>
                  ↑ {payload.rankDelta}
                </span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt>Flags</dt>
            <dd>
              {payload.flagsSolved}/{payload.flagsTotal}
            </dd>
          </div>
          <div>
            <dt>Elapsed</dt>
            <dd>{formatOperationElapsed(payload.elapsedMs)}</dd>
          </div>
        </dl>

        <div className="lp-flag-cap-actions">
          <Link href={nextHref} className={cn("lp-flag-cap-btn", "lp-flag-cap-btn--primary")}>
            {nextLabel}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            href={routes.contestPlay(payload.contestSlug)}
            className={cn("lp-flag-cap-btn", "lp-flag-cap-btn--ghost")}
            onClick={onClose}
          >
            Back to event
          </Link>
        </div>
      </dialog>
    </div>
  );
}
