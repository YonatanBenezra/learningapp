"use client";

import {
  formatCountdown,
  useDeadlineCountdown,
} from "@/features/contests/contest-clock";
import type { ContestSittingClock } from "@/types/contest";

export function ContestWorkspaceClock({ clock }: { clock: ContestSittingClock }) {
  const windowRemaining = useDeadlineCountdown(clock.windowDeadlineAt);
  const personalRemaining = useDeadlineCountdown(clock.personalDeadlineAt);

  const windowLabel =
    clock.window === "upcoming"
      ? "Starts in"
      : clock.window === "open"
        ? "Season ends in"
        : null;

  return (
    <div className="lp-ctd-ws-clock" aria-live="polite">
      {windowLabel && windowRemaining != null ? (
        <span>
          {windowLabel} <strong>{formatCountdown(windowRemaining)}</strong>
        </span>
      ) : null}
      {personalRemaining != null ? (
        <span className="lp-ctd-ws-clock-personal">
          Sitting <strong>{formatCountdown(personalRemaining)}</strong> left
        </span>
      ) : null}
    </div>
  );
}
