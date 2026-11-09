import { brand } from "@/config/brand";
import { routes } from "@/config/routes";
import {
  ARENA_CATEGORIES,
  type ArenaCategoryId,
} from "@/features/contests/arena/lib/categories";
import {
  contestHeroSubtitle,
  ctfEventDisplayTitle,
} from "@/features/contests/arena/lib/ctf-event-title";
import type { ContestDetail, ContestLeaderboardItem } from "@/types/contest";
import { EVENT_CATEGORY_COLOR } from "./category-colors";
import { missionRulesForContest } from "./mission-rules";
import type { EventBadgeKind, EventCategoryChip, EventDetailsData } from "./types";

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

/** Split display title into H1 head + muted suffix (no duplicate "CTF Try Out — CTF Try Out"). */
export function eventTitleParts(displayTitle: string): {
  head: string;
  subtitle: string | null;
} {
  const parts = displayTitle.split(/\s[—–-]\s/).map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) {
    return { head: displayTitle.trim(), subtitle: null };
  }
  const head = parts[0]!;
  const tail = parts.slice(1).join(" — ");
  if (head.localeCompare(tail, undefined, { sensitivity: "accent" }) === 0) {
    return { head, subtitle: null };
  }
  return { head, subtitle: tail };
}

function categoriesFromContest(contest: ContestDetail): EventCategoryChip[] {
  const counts = new Map<ArenaCategoryId, number>();
  for (const p of contest.problems) {
    const id = p.arenaCategory ?? "retrieval";
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const order: ArenaCategoryId[] = [
    "prompt-injection",
    "retrieval",
    "guardrails",
    "evals",
    "exfiltration",
  ];
  return order
    .filter((id) => (counts.get(id) ?? 0) > 0)
    .map((id) => ({
      id,
      name: ARENA_CATEGORIES[id].name,
      color: EVENT_CATEGORY_COLOR[id],
      count: counts.get(id) ?? 0,
    }));
}

const DEFAULT_ABOUT = [
  `Join ${brand.name} CTF Try Out — a jeopardy-style event built for hands-on AI security and engineering practice. Solve scenario-based challenges, earn points, and climb the live scoreboard as an individual operator.`,
  `Challenges span retrieval, guardrails, agents, and benchmarking. Each flag is validated against hidden graders so you get real feedback, not trivia. Read the brief, ship a solution, and iterate until the grader passes.`,
  `One account per operator — no team registration. Questions about rules or scoring? Reach out via Contact — we're happy to help.`,
];

export function mapContestToEventDetails(
  contest: ContestDetail,
  options?: {
    operatorsOnBoard?: number | null;
    leaderboardYou?: ContestLeaderboardItem | null;
  },
): EventDetailsData {
  const title = ctfEventDisplayTitle(contest.title);
  const { head: titleHead } = eventTitleParts(title);
  const shortTitle = contestHeroSubtitle(contest.title, contest.slug);
  const head = titleHead.split(/\s[—–-]\s/)[0]?.trim() || "CTF Try Out";
  const subtitle = shortTitle;
  const difficultyLabel = subtitle ? subtitle.toUpperCase() : "";
  const about = [...DEFAULT_ABOUT];
  if (contest.intent?.trim()) {
    about[0] = contest.intent.trim();
  }

  const categories = categoriesFromContest(contest);
  const catCount = categories.length || 5;
  const flagsSolved = contest.problems.filter((p) => p.scored).length;
  const flagsTotal = contest.sampledCount || contest.problemCount || contest.problems.length;

  let clockLeftMs: number | null = null;
  if (contest.personalDeadlineAt) {
    clockLeftMs = Math.max(0, new Date(contest.personalDeadlineAt).getTime() - Date.now());
  }

  const you = options?.leaderboardYou;
  const userProgress =
    contest.entered && you
      ? {
          flagsSolved: you.solvedCount,
          flagsTotal: you.totalCount || flagsTotal,
          rank: you.rank,
          rankDelta: 0,
          points: you.totalScore,
          clockLeftMs,
          firstBloods: 0,
        }
      : contest.entered
        ? {
            flagsSolved,
            flagsTotal,
            rank: null,
            rankDelta: 0,
            points: contest.totalScore ?? 0,
            clockLeftMs,
            firstBloods: 0,
          }
        : null;

  return {
    slug: contest.slug,
    title: subtitle ? `${head} — ${subtitle}` : head,
    subtitle,
    heroTitle: head,
    leadParagraph: about[0] ?? "",
    badges: badgesFor(contest),
    difficultyLabel,
    startAt: contest.startsAt,
    endAt: contest.endsAt,
    closesAt: contest.windowDeadlineAt ?? contest.endsAt,
    aboutParagraphs: about,
    host: {
      name: `${brand.name} CTF`,
      websiteUrl: routes.home,
      websiteLabel: "Visit website",
    },
    going: {
      operators: options?.operatorsOnBoard ?? null,
      teams: null,
      operatorSeeds: ["aa", "bk", "cr", "dm", "ev", "fz"],
      teamSeeds: ["t1", "t2", "t3", "t4"],
    },
    specs: [
      { id: "format", label: "Format", value: "Jeopardy" },
      { id: "type", label: "Event type", value: "Public" },
      { id: "location", label: "Location", value: "Online" },
      { id: "team", label: "Team size", value: "Solo operator" },
      { id: "scoring", label: "Scoring", value: "Dynamic" },
      { id: "hints", label: "Hints", value: "Disabled" },
    ],
    statsStrip: [
      {
        id: "challenges",
        label: "Challenges",
        value: String(contest.problemCount || flagsTotal),
        suffix: `${catCount} cats`,
        icon: "flag",
        iconColor: "#9FEF00",
        iconBg: "#1B2434",
      },
      {
        id: "clock",
        label: "Personal clock",
        value: String(contest.timeBoxMinutes),
        suffix: "min",
        icon: "timer",
        iconColor: "#FFAF00",
        iconBg: "#1B2434",
      },
      {
        id: "points",
        label: "Max points",
        value: contest.maxScore.toLocaleString(),
        icon: "award",
        iconColor: "#2F8BFF",
        iconBg: "#1B2434",
      },
      {
        id: "team",
        label: "Operators",
        value: "1",
        suffix: "per account",
        icon: "users",
        iconColor: "#8B7CFF",
        iconBg: "#1B2434",
      },
      {
        id: "bloods",
        label: "First bloods",
        value: "—",
        suffix: "taken",
        icon: "droplet",
        iconColor: "#FF5A5F",
        iconBg: "#1B2434",
      },
    ],
    categories,
    challengeCount: contest.problemCount || flagsTotal,
    updatesCount: 0,
    window: contest.window,
    canEnter: contest.canEnter,
    entered: contest.entered,
    missionRules: missionRulesForContest(contest),
    userProgress,
  };
}
