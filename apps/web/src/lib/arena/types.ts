export type EventStatus = "live" | "upcoming" | "archived";

export type EventAccent = "lime" | "cyan" | "purple";

export type FeedVerb = "captured" | "failed" | "joined";

export type ArenaEvent = {
  id: string;
  slug: string;
  title: string;
  status: EventStatus;
  difficulty: string;
  challengeCount: number;
  operatorCount: number;
  clockMinutes: number;
  startsAt: string;
  endsAt: string;
  code: string;
  accent: EventAccent;
  description: string;
  myResult?: string;
  registeredCount?: number;
  kicker: string;
  lead: string;
};

export type FeedItem = {
  id: string;
  time: string;
  user: string;
  verb: FeedVerb;
  challenge: string;
  points?: number;
  firstBlood?: boolean;
};

export type ArenaOperator = {
  rank: number;
  name: string;
  score: number;
  initials: string;
  medal: "gold" | "silver" | "bronze";
};

export type ArenaTab = "live" | "upcoming" | "archived" | "my";

export type ArenaHeroStats = {
  operators: number;
  flagsCaptured: number;
  firstBloods: string;
  clockMinutes: number;
};
