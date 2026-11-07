export type ChartRange = "1d" | "7d" | "all";

export type ScoreTimePoint = {
  time: number;
  points: number;
  label: string;
};

export type ScoreboardEntry = {
  id: string;
  rank: number;
  name: string;
  avatarUrl?: string;
  /** ISO country when API provides it; empty = unknown */
  country: string;
  points: number;
  solved: number;
  total: number;
  isYou?: boolean;
  elapsedMs: number | null;
  series: ScoreTimePoint[];
};

export const CHART_SERIES_COLORS = [
  "#9FEF00",
  "#FF3E5F",
  "#FFB020",
  "#A855F7",
  "#34E0A1",
  "#2F8BFF",
  "#FF7A1A",
  "#6D4CFF",
  "#FF3DB4",
  "#D8FF5A",
] as const;

export const RANK_TINT = {
  gold: "#F5B70A",
  silver: "#A9B4CC",
  bronze: "#FF8A00",
} as const;
