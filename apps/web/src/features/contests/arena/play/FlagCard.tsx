import { Flag } from "lucide-react";

export function FlagCard({
  solved,
  solveTime,
  points,
}: {
  solved?: boolean;
  solveTime?: string;
  points?: number;
}) {
  return (
    <div className="rounded-lg border border-dashed border-[color-mix(in_srgb,var(--arena-lime)_40%,var(--arena-line))] bg-[color-mix(in_srgb,var(--arena-lime)_4%,transparent)] px-3.5 py-3">
      <div className="flex items-center gap-3">
        <Flag className="size-4 shrink-0 text-[var(--arena-lime-fg)]" aria-hidden />
        <span className="font-mono text-[13px] font-semibold text-[var(--arena-lime-fg)]">
          {solved ? "LABPATH{weekly_ctf_flag}" : "LABPATH{••••••••••••••••}"}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-[var(--arena-text-2)]">
        {solved && solveTime
          ? `Captured ${solveTime}${points != null ? ` · +${points} pts` : ""}`
          : "Captured automatically when your config passes the hidden grader."}
      </p>
    </div>
  );
}
