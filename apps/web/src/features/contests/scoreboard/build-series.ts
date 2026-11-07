import type { ContestLeaderboardItem } from "@/types/contest";
import type { ScoreTimePoint } from "./types";

function formatAxisLabel(t: number): string {
  const d = new Date(t);
  const date = d.toLocaleString("en-US", { month: "short", day: "numeric" }).toUpperCase();
  const time = d
    .toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toUpperCase();
  return `${date}\n${time}`;
}

/** Stepped progression from solve count + elapsed (no per-flag timestamps from API). */
export function buildSeriesFromLeaderboardItem(
  item: ContestLeaderboardItem,
  nowMs = Date.now(),
): ScoreTimePoint[] {
  const elapsed = Math.max(60_000, item.elapsedMs ?? 60_000);
  const tStart = nowMs - elapsed;
  const series: ScoreTimePoint[] = [{ time: tStart, points: 0, label: formatAxisLabel(tStart) }];

  if (item.totalScore <= 0) {
    return [...series, { time: nowMs, points: 0, label: formatAxisLabel(nowMs) }];
  }

  const solves = Math.max(1, item.solvedCount);
  let acc = 0;
  for (let i = 0; i < solves; i++) {
    const remaining = solves - i;
    const inc = Math.max(1, Math.round((item.totalScore - acc) / remaining));
    acc = Math.min(item.totalScore, acc + inc);
    const progress = (i + 1) / solves;
    const t = tStart + Math.round(elapsed * progress);
    series.push({ time: t, points: acc, label: formatAxisLabel(t) });
  }

  const last = series.at(-1)!;
  if (last.points !== item.totalScore || last.time < nowMs) {
    series.push({
      time: Math.max(last.time, nowMs),
      points: item.totalScore,
      label: formatAxisLabel(nowMs),
    });
  }

  return series;
}
