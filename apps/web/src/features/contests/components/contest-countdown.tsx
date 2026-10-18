"use client";

import {
  formatCountdown,
  useDeadlineCountdown,
} from "@/features/contests/contest-clock";
import type { ContestWindow } from "@/types/contest";

type ContestCountdownProps = {
  window: ContestWindow;
  windowDeadlineAt: string | null;
  personalDeadlineAt?: string | null;
  compact?: boolean;
};

export function ContestCountdown({
  window,
  windowDeadlineAt,
  personalDeadlineAt,
  compact = false,
}: ContestCountdownProps) {
  const windowRemaining = useDeadlineCountdown(windowDeadlineAt);
  const personalRemaining = useDeadlineCountdown(personalDeadlineAt ?? null);

  const windowLabel =
    window === "upcoming"
      ? "Starts in"
      : window === "open"
        ? "Contest ends in"
        : null;

  if (!windowLabel && personalRemaining == null) {
    return null;
  }

  return (
    <div
      className={`lp-ctd-clocks${compact ? " lp-ctd-clocks--compact" : ""}`}
      aria-live="polite"
    >
      {windowLabel && windowRemaining != null ? (
        <p className="lp-ctd-clock">
          <span className="lp-ctd-clock-label">{windowLabel}</span>
          <strong>{formatCountdown(windowRemaining)}</strong>
        </p>
      ) : null}
      {personalRemaining != null ? (
        <p className="lp-ctd-clock lp-ctd-clock--personal">
          <span className="lp-ctd-clock-label">Your time left</span>
          <strong>{formatCountdown(personalRemaining)}</strong>
        </p>
      ) : null}
    </div>
  );
}
