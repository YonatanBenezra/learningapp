import { brand } from "@/config/brand";
import { routes } from "@/config/routes";
import type { ContestDetail } from "@/types/contest";
import type { EventBadgeKind, EventDetailsData } from "./types";

function badgesFor(contest: ContestDetail): EventBadgeKind[] {
  const out: EventBadgeKind[] = [];
  if (contest.problemCount >= 8) {
    out.push("featured");
  }
  if (contest.window === "open") {
    out.push("live");
  } else if (contest.window === "upcoming") {
    out.push("upcoming");
  } else {
    out.push("ended");
  }
  return out;
}

const DEFAULT_ABOUT = [
  `Join ${brand.name} CTF Try Out — a jeopardy-style event built for hands-on AI security and engineering practice. Solve scenario-based challenges, earn points, and climb the scoreboard with teams worldwide.`,
  `Challenges span retrieval, guardrails, agents, and benchmarking. Each flag is validated against hidden graders so you get real feedback, not trivia. Read the brief, ship a solution, and iterate until the grader passes.`,
  `Team up (max 5) or play solo. Questions about rules or scoring? Reach out via Contact — we're happy to help.`,
];

export function mapContestToEventDetails(contest: ContestDetail): EventDetailsData {
  const title = contest.title.replace(/^Weekly Contest #(\d+)/i, "CTF Try Out");
  const about = [...DEFAULT_ABOUT];
  if (contest.intent?.trim()) {
    about[0] = contest.intent.trim();
  }
  return {
    slug: contest.slug,
    title,
    heroTitle: title,
    badges: badgesFor(contest),
    startAt: contest.startsAt,
    endAt: contest.endsAt,
    aboutParagraphs: about,
    host: {
      name: `${brand.name} CTF`,
      websiteUrl: routes.home,
      websiteLabel: "Visit website",
    },
    stats: {
      playersJoined: Math.max(320, contest.problemCount * 312),
      teamsJoined: Math.max(280, contest.problemCount * 288),
      playerAvatarSeeds: ["aa", "bk", "cr", "dm", "ev"],
      teamAvatarSeeds: ["t1", "t2", "t3", "t4"],
    },
    specs: [
      { id: "format", label: "Format", value: "Jeopardy", icon: "flag" },
      { id: "type", label: "Event Type", value: "Public", icon: "globe" },
      { id: "location", label: "Location", value: "Online", icon: "map-pin" },
      {
        id: "team",
        label: "Team size",
        value: "Max 5 players per team",
        icon: "users",
      },
      {
        id: "scenarios",
        label: "Scenarios",
        value: `${contest.problemCount || 37} across ${Math.max(4, Math.ceil((contest.problemCount || 37) / 4))} categories`,
        icon: "swords",
      },
    ],
    window: contest.window,
    canEnter: contest.canEnter,
    entered: contest.entered,
  };
}
