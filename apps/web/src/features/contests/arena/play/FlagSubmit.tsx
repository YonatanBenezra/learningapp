"use client";

import { graderCaptureMessage } from "./play-contest-phase";

export function FlagSubmit({
  scoringClosed,
  solved,
}: {
  /** When true, ranked scoring is closed (practice only). */
  scoringClosed?: boolean;
  solved?: boolean;
}) {
  if (solved) {
    return (
      <div className="rounded-sm border border-[#9FEF00]/30 bg-[#9FEF00]/5 px-4 py-3">
        <p className="font-mono text-sm text-[#9FEF00]">Challenge solved</p>
        <p className="mt-1 text-xs text-[#6B7891]">
          Score captured from the hidden grader — no manual flag required.
        </p>
      </div>
    );
  }

  return (
    <p className="rounded-sm border border-[#232C3D] bg-[#0F1520] px-4 py-3 text-xs leading-relaxed text-[#6B7891]">
      <span className="font-semibold uppercase tracking-wider text-[#A4B1CD]">
        How scoring works
      </span>
      <span className="mt-2 block">{graderCaptureMessage(Boolean(scoringClosed))}</span>
    </p>
  );
}
