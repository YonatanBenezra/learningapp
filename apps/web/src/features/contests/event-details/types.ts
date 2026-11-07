export type EventBadgeKind = "featured" | "live" | "upcoming" | "ended";

export type EventSpecRow = {
  id: string;
  label: string;
  value: string;
  icon: "flag" | "globe" | "map-pin" | "users" | "swords";
};

export type EventHostInfo = {
  name: string;
  websiteUrl: string;
  websiteLabel: string;
};

export type EventSocialStats = {
  playersJoined: number;
  teamsJoined: number;
  playerAvatarSeeds: string[];
  teamAvatarSeeds: string[];
};

export type EventDetailsData = {
  slug: string;
  title: string;
  heroTitle: string;
  badges: EventBadgeKind[];
  startAt: string;
  endAt: string;
  aboutParagraphs: string[];
  host: EventHostInfo;
  stats: EventSocialStats;
  specs: EventSpecRow[];
  window: "upcoming" | "open" | "closed";
  canEnter: boolean;
  entered: boolean;
};
