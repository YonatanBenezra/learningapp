import type { EventBadgeKind } from "@/features/contests/event-details/types";
import { cn } from "@/lib/utils";

const STYLES: Record<EventBadgeKind, string> = {
  featured: "bg-[#0E3B2E] text-[#2EE6A6]",
  live: "bg-[#3B1418] text-[#FF5A5F]",
  upcoming: "bg-[#232C3D] text-[#A4B1CD]",
  ended: "bg-[#232C3D] text-[#6B7891]",
};

const LABELS: Record<EventBadgeKind, string> = {
  featured: "FEATURED",
  live: "LIVE",
  upcoming: "UPCOMING",
  ended: "ENDED",
};

export function StatusBadge({ kind }: { kind: EventBadgeKind }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-wide",
        STYLES[kind],
      )}
    >
      {kind === "live" ? (
        <span className="relative flex size-1.5" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#FF5A5F] opacity-70" />
          <span className="relative inline-flex size-1.5 rounded-full bg-[#FF5A5F]" />
        </span>
      ) : null}
      {LABELS[kind]}
    </span>
  );
}

export function DifficultyBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-wide bg-[#232C3D] text-[#A4B1CD]">
      {label}
    </span>
  );
}
