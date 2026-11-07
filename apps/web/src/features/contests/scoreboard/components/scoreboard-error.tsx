"use client";

export function ScoreboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="lp-sb-container flex flex-col items-center gap-4 py-24 text-center">
      <p className="text-lg font-semibold text-white">Could not load scoreboard</p>
      <p className="text-[14px] text-[#A4B1CD]">Check your connection and try again.</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md border border-[#2A3446] px-4 py-2 text-[14px] font-medium text-white transition-colors hover:border-[#9FEF00]"
      >
        Retry
      </button>
    </div>
  );
}
