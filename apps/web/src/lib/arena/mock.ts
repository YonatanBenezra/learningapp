import type { ArenaEvent, ArenaOperator, FeedItem } from "./types";

export {
  LOBBY_RULES,
  LOBBY_CATEGORIES,
  LOBBY_CHALLENGE_PREVIEWS,
  LOBBY_SCOREBOARD,
  buildLobbyFromApi,
} from "./lobby-mock";

export const MOCK_FEED: FeedItem[] = [
  {
    id: "f1",
    time: "14:02:11",
    user: "nadia.k",
    verb: "captured",
    challenge: "Defense in Depth",
    points: 500,
    firstBlood: true,
  },
  {
    id: "f2",
    time: "14:01:47",
    user: "rafi_dev",
    verb: "captured",
    challenge: "Indirect Injection",
    points: 372,
  },
  {
    id: "f3",
    time: "14:00:30",
    user: "tanvir.ml",
    verb: "failed",
    challenge: "FP/FN Tradeoff",
  },
  {
    id: "f4",
    time: "13:59:02",
    user: "mehjabin",
    verb: "captured",
    challenge: "Hybrid Search",
    points: 136,
  },
  {
    id: "f5",
    time: "13:58:44",
    user: "sakib-r",
    verb: "captured",
    challenge: "PII Redaction",
    points: 248,
  },
  {
    id: "f6",
    time: "13:57:10",
    user: "zayan.a",
    verb: "joined",
    challenge: "the event",
  },
];

export const MOCK_OPERATORS: ArenaOperator[] = [
  { rank: 1, name: "nadia.k", score: 4820, initials: "NK", medal: "gold" },
  { rank: 2, name: "rafi_dev", score: 4412, initials: "RD", medal: "silver" },
  { rank: 3, name: "tanvir.ml", score: 4180, initials: "TM", medal: "bronze" },
];

export const MOCK_EVENTS: ArenaEvent[] = [
  {
    id: "weekly-advanced-1",
    slug: "weekly-advanced-1",
    title: "Weekly CTF #1 — Advanced",
    status: "live",
    difficulty: "ADVANCED",
    challengeCount: 15,
    operatorCount: 214,
    clockMinutes: 180,
    startsAt: "2026-10-18T00:00:00.000Z",
    endsAt: "2026-10-27T12:00:00.000Z",
    code: "W#01",
    accent: "lime",
    kicker: "> weekly_ctf_01",
    lead: "15 RAG & Guardrails challenges. Break, tune and defend AI pipelines against a hidden grader — every pass drops a flag. Fastest operators climb the board.",
    description:
      "Fixed set of 15 challenges for every operator. 180-min clock starts on join.",
  },
  {
    id: "weekly-advanced-2",
    slug: "weekly-advanced-2",
    title: "Weekly CTF #2 — Advanced",
    status: "upcoming",
    difficulty: "ADVANCED",
    challengeCount: 15,
    operatorCount: 86,
    registeredCount: 86,
    clockMinutes: 180,
    startsAt: "2026-11-04T00:00:00.000Z",
    endsAt: "2026-11-11T12:00:00.000Z",
    code: "W#02",
    accent: "cyan",
    kicker: "> weekly_ctf_02",
    lead: "Same rules as Weekly #1 — fresh draw at launch.",
    description: "Fresh draw, same rules. Register now and get a reminder before launch.",
  },
  {
    id: "beta-ctf-0",
    slug: "beta-ctf-0",
    title: "Beta CTF #0 — Intermediate",
    status: "archived",
    difficulty: "INTERMEDIATE",
    challengeCount: 12,
    operatorCount: 96,
    clockMinutes: 180,
    startsAt: "2026-09-01T00:00:00.000Z",
    endsAt: "2026-10-01T12:00:00.000Z",
    code: "B#00",
    accent: "purple",
    kicker: "> beta_ctf_00",
    lead: "Pilot season — board frozen.",
    description: "Pilot event. Final board frozen — replay every challenge unranked.",
    myResult: "YOU FINISHED #18",
  },
];

export const EXTRA_FEED: FeedItem[] = [
  {
    id: "x1",
    time: "14:03:02",
    user: "dev",
    verb: "captured",
    challenge: "Citation Contract",
    points: 420,
  },
  {
    id: "x2",
    time: "14:02:55",
    user: "ops.lead",
    verb: "joined",
    challenge: "the event",
  },
];
