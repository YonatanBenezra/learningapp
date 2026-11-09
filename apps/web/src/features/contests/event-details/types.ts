import type { ArenaCategoryId } from "@/features/contests/arena/lib/categories";
import type { LobbyRule } from "@/features/contests/arena/lib/lobby-types";

export type EventBadgeKind = "featured" | "live" | "upcoming" | "ended";

export type EventTabId = "overview" | "rules" | "challenges" | "scoreboard" | "updates";

export type EventCategoryChip = {
  id: ArenaCategoryId;
  name: string;
  color: string;
  count: number;
};

export type EventStatCell = {
  id: string;
  label: string;
  value: string;
  suffix?: string;
  icon: "flag" | "timer" | "award" | "users" | "droplet";
  iconColor: string;
  iconBg: string;
};

export type EventHostInfo = {
  name: string;
  websiteUrl: string;
  websiteLabel: string;
};

export type EventGoingStats = {
  operators: number | null;
  teams: number | null;
  operatorSeeds: string[];
  teamSeeds: string[];
};

export type EventSpec = {
  id: string;
  label: string;
  value: string;
};

export type EventUserProgress = {
  flagsSolved: number;
  flagsTotal: number;
  rank: number | null;
  rankDelta: number;
  points: number;
  clockLeftMs: number | null;
  firstBloods: number;
};

export type EventDetailsData = {
  slug: string;
  title: string;
  subtitle: string;
  heroTitle: string;
  leadParagraph: string;
  badges: EventBadgeKind[];
  difficultyLabel: string;
  startAt: string;
  endAt: string;
  closesAt: string;
  aboutParagraphs: string[];
  host: EventHostInfo;
  going: EventGoingStats;
  specs: EventSpec[];
  statsStrip: EventStatCell[];
  categories: EventCategoryChip[];
  missionRules: LobbyRule[];
  challengeCount: number;
  updatesCount: number;
  window: "upcoming" | "open" | "closed";
  canEnter: boolean;
  entered: boolean;
  userProgress: EventUserProgress | null;
};
