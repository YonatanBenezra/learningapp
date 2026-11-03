import type { XpDay } from "@/features/profile/platform/types";

export type XpWeek = { start: string; xp: number };

function mondayOf(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** 52 weeks ending with the week that contains `end` (default today). */
export function generateWeekSlots(end = new Date(), count = 52): XpWeek[] {
  const anchor = mondayOf(end);
  const weeks: XpWeek[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const start = new Date(anchor);
    start.setDate(start.getDate() - i * 7);
    weeks.push({ start: isoDate(start), xp: 0 });
  }
  return weeks;
}

export function aggregateDaysIntoWeeks(days: XpDay[], slots = generateWeekSlots()): XpWeek[] {
  const xpByMonday = new Map(slots.map((w) => [w.start, 0]));
  for (const day of days) {
    const monday = isoDate(mondayOf(new Date(day.date)));
    if (xpByMonday.has(monday)) {
      xpByMonday.set(monday, (xpByMonday.get(monday) ?? 0) + day.xp);
    }
  }
  return slots.map((w) => ({ start: w.start, xp: xpByMonday.get(w.start) ?? 0 }));
}

export function mockWeeksEmpty(): XpWeek[] {
  return generateWeekSlots();
}

export function mockWeeksRandom(seed = 7): XpWeek[] {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  return generateWeekSlots().map((w) => ({
    ...w,
    xp: rand() > 0.55 ? Math.floor(rand() * 120) : 0,
  }));
}

export type MonthXpColumn = {
  label: string;
  weeks: XpWeek[];
};

/** Group weeks into 12 month columns (oldest → newest), Monday-in-month rule. */
export function groupWeeksByMonth(weeks: XpWeek[], now = new Date()): MonthXpColumn[] {
  const columns: MonthXpColumn[] = [];
  for (let offset = 11; offset >= 0; offset -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const label = d.toLocaleDateString("en-US", { month: "short" });
    columns.push({ label, weeks: [] });
  }

  for (const week of weeks) {
    const monday = new Date(week.start);
    const colIndex = columns.findIndex((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return d.getFullYear() === monday.getFullYear() && d.getMonth() === monday.getMonth();
    });
    if (colIndex >= 0) {
      columns[colIndex].weeks.push(week);
    }
  }

  return columns;
}

export function weekRangeLabel(startIso: string): string {
  const start = new Date(startIso);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function xpBarColor(xp: number): string {
  if (xp <= 0) return "#1E2939";
  if (xp < 15) return "#2F4A1A";
  if (xp < 40) return "#4E7A12";
  if (xp < 80) return "#74B308";
  return "#9FEF00";
}

export function computeXpStats(weeks: XpWeek[]) {
  const total = weeks.reduce((sum, w) => sum + w.xp, 0);
  const activeWeeks = weeks.filter((w) => w.xp > 0).length;
  const weeklyAverage = activeWeeks > 0 ? Math.round(total / activeWeeks) : 0;
  return {
    total,
    weeksActive: activeWeeks,
    weeklyAverage,
  };
}
