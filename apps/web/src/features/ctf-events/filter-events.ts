import type { ArenaEvent } from "@/features/contests/arena/lib/types";
import type { CtfEventTab } from "@/features/ctf-events/types";

export function filterArenaEvents(events: ArenaEvent[], tab: CtfEventTab, query: string) {
  let list = events;
  if (tab === "joined") {
    list = list.filter((e) => e.entered);
  } else if (tab === "past") {
    list = list.filter((e) => e.status === "archived");
  } else if (tab === "live") {
    list = list.filter((e) => e.status === "live");
  } else if (tab === "upcoming") {
    list = list.filter((e) => e.status === "upcoming");
  }

  const q = query.trim().toLowerCase();
  if (!q) {
    return list;
  }
  return list.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.slug.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q),
  );
}
