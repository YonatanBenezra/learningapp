import type { EventBadgeKind } from "@/features/contests/event-details/types";
import { cn } from "@/lib/utils";

const STYLES: Record<EventBadgeKind, string> = {
  featured: "bg-[#0E3B2E] text-[#2EE6A6]",
  live: "bg-[#3B1418] text-[#FF5A5F]",
  upcoming: "bg-[#1E2636] text-[#A4B1CD]",
  ended: "bg-[#1E2636] text-[#6B7891]",
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
        "inline-flex rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wide",
        STYLES[kind],
      )}
    >
      {LABELS[kind]}
    </span>
  );
}
