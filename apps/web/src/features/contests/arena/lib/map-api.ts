import type { ContestListItem, ContestWindow } from "@/types/contest";
import type { ArenaEvent, EventAccent, EventStatus } from "./types";

function windowToStatus(window: ContestWindow): EventStatus {
  if (window === "open") {
    return "live";
  }
  if (window === "upcoming") {
    return "upcoming";
  }
  return "archived";
}

function accentFor(contest: ContestListItem): EventAccent {
  if (contest.window === "open") {
    return "lime";
  }
  if (contest.window === "upcoming") {
    return "cyan";
  }
  return "purple";
}

function codeFor(slug: string) {
  const match = slug.match(/(\d+)/);
  const num = match?.[1] ?? "0";
  const prefix = slug.includes("beta") ? "B" : "W";
  return `${prefix}#${num.padStart(2, "0")}`;
}

function kickerFor(slug: string) {
  const match = slug.match(/(\d+)/);
  const num = match?.[1] ?? "0";
  const prefix = slug.includes("beta") ? "beta_ctf" : "weekly_ctf";
  return `> ${prefix}_${num.padStart(2, "0")}`;
}

export function mapContestToArenaEvent(contest: ContestListItem): ArenaEvent {
  const title = contest.title.replace(/Contest/gi, "CTF");
  const lead = contest.intent?.trim() || `${contest.problemCount} challenges · timed operation.`;
  return {
    id: contest.slug,
    slug: contest.slug,
    title,
    status: windowToStatus(contest.window),
    difficulty: title.includes("Advanced")
      ? "ADVANCED"
      : title.includes("Intermediate")
        ? "INTERMEDIATE"
        : "STANDARD",
    challengeCount: contest.problemCount,
    operatorCount: 0,
    clockMinutes: contest.timeBoxMinutes,
    startsAt: contest.startsAt,
    endsAt: contest.endsAt,
    code: codeFor(contest.slug),
    accent: accentFor(contest),
    description: `${contest.problemCount} challenges · ${contest.timeBoxMinutes}m operation clock.`,
    kicker: kickerFor(contest.slug),
    lead,
    entered: contest.entered,
  };
}

/** Map API contest list — no synthetic catalog rows. */
export function listArenaEvents(apiItems: ContestListItem[]): ArenaEvent[] {
  const mapped = apiItems.map(mapContestToArenaEvent);
  const order: Record<EventStatus, number> = { live: 0, upcoming: 1, archived: 2 };
  return mapped.sort((a, b) => order[a.status] - order[b.status]);
}

/** @deprecated Use {@link listArenaEvents}. */
export function mergeArenaEvents(apiItems: ContestListItem[]): ArenaEvent[] {
  return listArenaEvents(apiItems);
}
