import type { ContestDetail } from "@/types/contest";

/** Global season window (startsAt → endsAt) — not personal 180m time box. */
export function globalEventEnded(contest: ContestDetail) {
  return contest.window === "closed";
}

/** No new scored submissions (personal timer or global window). */
export function scoringClosed(contest: ContestDetail) {
  return (
    globalEventEnded(contest) ||
    contest.status === "expired" ||
    contest.status === "finished"
  );
}

export function personalTimeEnded(contest: ContestDetail) {
  return (
    contest.entered &&
    contest.window === "open" &&
    (contest.status === "expired" || contest.status === "finished")
  );
}

export type ScoringPhase = "live" | "personal_over" | "event_ended";

export function scoringPhase(contest: ContestDetail): ScoringPhase {
  if (globalEventEnded(contest)) {
    return "event_ended";
  }
  if (personalTimeEnded(contest)) {
    return "personal_over";
  }
  return "live";
}

/** Banner under arena header when ranked scoring is off. */
export function scoringBannerMessage(contest: ContestDetail): string | null {
  const phase = scoringPhase(contest);
  if (phase === "live") {
    return null;
  }
  if (phase === "event_ended") {
    return contest.virtualPracticeAvailable
      ? "Event ended — ranked scoring is closed. Labs and virtual practice stay open."
      : "Event ended — ranked scoring is closed. Labs stay open for practice.";
  }
  return "Your operation clock ended — ranked scoring is closed. Labs stay open for practice.";
}

/** Challenge drawer footer when ranked scoring is off. */
export function drawerScoringMessage(contest: ContestDetail): string | null {
  return scoringBannerMessage(contest);
}

/** Drawer body — how captures work (no manual flag API). */
export function graderCaptureMessage(scoringClosed: boolean): string {
  if (scoringClosed) {
    return "Practice mode — passes in the lab do not change your contest score.";
  }
  return "Open the lab and pass the hidden grader to capture this flag. Ranked play does not use a manual flag field.";
}
