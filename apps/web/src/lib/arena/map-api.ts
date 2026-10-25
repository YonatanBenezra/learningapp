import type { ContestListItem, ContestWindow } from "@/types/contest";
import { MOCK_EVENTS } from "./mock";
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
  const mock = MOCK_EVENTS.find((e) => e.slug === contest.slug);
  const title = contest.title.replace(/Contest/gi, "CTF");
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
    operatorCount: mock?.operatorCount ?? 0,
    clockMinutes: contest.timeBoxMinutes,
    startsAt: contest.startsAt,
    endsAt: contest.endsAt,
    code: codeFor(contest.slug),
    accent: accentFor(contest),
    description:
      mock?.description ??
      `${contest.problemCount} challenges · ${contest.timeBoxMinutes}m operation clock.`,
    kicker: kickerFor(contest.slug),
    lead:
      contest.slug === "weekly-advanced-1"
        ? "15 RAG & Guardrails challenges. Break, tune and defend AI pipelines against a hidden grader — every pass drops a flag. Fastest operators climb the board."
        : contest.intent,
    registeredCount: mock?.registeredCount,
    myResult: contest.entered && contest.window === "closed" ? mock?.myResult : undefined,
  };
}

/** Merge API list with mock catalog so grid matches design when API has fewer rows. */
export function mergeArenaEvents(apiItems: ContestListItem[]): ArenaEvent[] {
  const mapped = apiItems.map(mapContestToArenaEvent);
  const slugs = new Set(mapped.map((e) => e.slug));
  for (const mock of MOCK_EVENTS) {
    if (!slugs.has(mock.slug)) {
      mapped.push(mock);
    }
  }
  const order: Record<EventStatus, number> = { live: 0, upcoming: 1, archived: 2 };
  return mapped.sort((a, b) => order[a.status] - order[b.status]);
}
