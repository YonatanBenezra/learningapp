import type { ArenaEvent } from "@/features/contests/arena/lib/types";
import type { CtfEventTab } from "@/features/ctf-events/types";

export function ctfTabCounts(events: ArenaEvent[]): Record<CtfEventTab, number> {
  const counts: Record<CtfEventTab, number> = {
    live: 0,
    upcoming: 0,
    joined: 0,
    past: 0,
  };
  for (const e of events) {
    if (e.status === "live") {
      counts.live += 1;
    }
    if (e.status === "upcoming") {
      counts.upcoming += 1;
    }
    if (e.status === "archived") {
      counts.past += 1;
    }
    if (e.entered) {
      counts.joined += 1;
    }
  }
  return counts;
}
