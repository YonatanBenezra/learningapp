export type CtfEventTab = "live" | "upcoming" | "joined" | "past";

export type CtfEventBadge = "featured" | "mcp";

export type CtfBannerVariant = "navy-grid" | "lime-dark" | "blue-bright";

export type CtfEventStatus = "live" | "upcoming" | "archived";

export type CtfEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  status: CtfEventStatus;
  badges: CtfEventBadge[];
  players: number;
  capacity?: number;
  joined?: boolean;
  bannerVariant: CtfBannerVariant;
};
