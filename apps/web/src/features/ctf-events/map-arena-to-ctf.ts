/** Sole mapper from arena hub `ArenaEvent` cards to hub UI `CtfEvent` — keep in sync with `listArenaEvents`. */
import type { ArenaEvent } from "@/features/contests/arena/lib/types";
import type { CtfBannerVariant, CtfEvent, CtfEventBadge } from "@/features/ctf-events/types";

function bannerVariant(accent: ArenaEvent["accent"]): CtfBannerVariant {
  if (accent === "lime") {
    return "lime-dark";
  }
  if (accent === "cyan") {
    return "blue-bright";
  }
  return "navy-grid";
}

function badgesFor(event: ArenaEvent): CtfEventBadge[] {
  const badges: CtfEventBadge[] = [];
  if (event.status === "live") {
    badges.push("featured");
  }
  const hay = `${event.title} ${event.lead} ${event.description}`.toLowerCase();
  if (hay.includes("rag") || hay.includes("guardrail") || hay.includes("mcp")) {
    badges.push("mcp");
  }
  return badges;
}

function playersFor(event: ArenaEvent) {
  return event.operatorCount;
}

export function mapArenaToCtfEvent(event: ArenaEvent): CtfEvent {
  return {
    id: event.slug,
    title: event.title,
    start: event.startsAt,
    end: event.endsAt,
    status: event.status,
    badges: badgesFor(event),
    players: playersFor(event),
    joined: event.entered,
    bannerVariant: bannerVariant(event.accent),
  };
}
