"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartRange, ScoreboardEntry } from "../types";
import { CHART_SERIES_COLORS } from "../types";
import { ChartLegend } from "./chart-legend";

function formatPointsK(value: number): string {
  if (value >= 1000) {
    return `${Math.round(value / 1000)}K`;
  }
  return String(value);
}

function filterSeriesByRange(series: ScoreboardEntry["series"], range: ChartRange): ScoreboardEntry["series"] {
  if (range === "all" || series.length === 0) {
    return series;
  }
  const end = series.at(-1)!.time;
  const span = range === "1d" ? 86_400_000 : 7 * 86_400_000;
  const min = end - span;
  const filtered = series.filter((p) => p.time >= min);
  return filtered.length > 0 ? filtered : series.slice(0, 2);
}

type ChartSeries = ScoreboardEntry & { color: string };

function ChartTooltip({
  active,
  payload,
  operators,
}: {
  active?: boolean;
  payload?: { payload: { time: number; points: number; teamId: string } }[];
  operators: ChartSeries[];
}) {
  if (!active || !payload?.length) {
    return null;
  }
  const row = payload[0]?.payload;
  if (!row) {
    return null;
  }
  const op = operators.find((t) => t.id === row.teamId);
  const point = op?.series.find((p) => p.time === row.time);
  const timeLabel = point?.label?.replace("\n", " ") ?? "";
  return (
    <div className="rounded-lg border border-[#2A3446] bg-[#0F1520] px-3 py-2 shadow-lg">
      <p className="text-[11px] text-[#6B7891]">{timeLabel}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ backgroundColor: op?.color }} aria-hidden />
        <span className="text-[13px] text-white">{op?.name}</span>
        <span className="font-mono text-[13px] tabular-nums text-white/80">
          {row.points.toLocaleString()} pts
        </span>
      </div>
    </div>
  );
}

const RANGES: { id: ChartRange; label: string }[] = [
  { id: "1d", label: "1D" },
  { id: "7d", label: "7D" },
  { id: "all", label: "All" },
];

function yScale(maxScore: number, entries: ScoreboardEntry[]) {
  const peak = Math.max(maxScore, ...entries.map((e) => e.points), 1);
  const rawStep = peak / 8;
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(rawStep, 1)));
  const step = Math.ceil(rawStep / magnitude) * magnitude;
  const top = Math.max(step, Math.ceil(peak / step) * step);
  const ticks: number[] = [];
  for (let v = 0; v <= top; v += step) {
    ticks.push(v);
  }
  return { top, ticks };
}

export function ScoreChart({
  entries,
  maxScore = 0,
}: {
  entries: ScoreboardEntry[];
  maxScore?: number;
}) {
  const [range, setRange] = useState<ChartRange>("all");
  const [windowStart, setWindowStart] = useState(1);
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const chartSeries: ChartSeries[] = useMemo(() => {
    return entries
      .filter((t) => t.rank >= windowStart && t.rank < windowStart + 10)
      .map((t, i) => ({
        ...t,
        series: filterSeriesByRange(t.series, range),
        color: CHART_SERIES_COLORS[i % CHART_SERIES_COLORS.length]!,
      }));
  }, [entries, windowStart, range]);

  const canPrev = windowStart > 1;
  const maxRank = entries.reduce((m, e) => Math.max(m, e.rank), 0);
  const canNext = windowStart + 10 < maxRank;

  const toggleSeries = (id: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const xTicks = useMemo(() => {
    const first = chartSeries[0]?.series ?? [];
    if (first.length === 0) {
      return [];
    }
    const picks = [0, Math.floor(first.length / 2), first.length - 1];
    return [...new Set(picks)].map((i) => first[i]!.time);
  }, [chartSeries]);

  const { top: yMax, ticks: yTicks } = useMemo(
    () => yScale(maxScore, entries),
    [entries, maxScore],
  );

  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-[#232C3D] bg-[#151C2B] py-8">
      <div className="lp-sb-container">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-[18px] font-semibold text-white">Top 10 Operators</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="inline-flex rounded-md bg-[#0F1520] p-0.5"
              role="group"
              aria-label="Chart time range"
            >
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`rounded px-3 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9FEF00] ${
                    range === r.id
                      ? "bg-[#232C3D] text-[#9FEF00]"
                      : "text-[#A4B1CD] hover:text-white"
                  }`}
                  onClick={() => setRange(r.id)}
                  aria-pressed={range === r.id}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={!canPrev}
                className="inline-flex size-8 items-center justify-center rounded-full border border-[#2A3446] text-[#A4B1CD] transition-colors hover:border-[#9FEF00] hover:text-white disabled:opacity-40"
                aria-label="Previous operators"
                onClick={() => setWindowStart((s) => Math.max(1, s - 10))}
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                disabled={!canNext}
                className="inline-flex size-8 items-center justify-center rounded-full border border-[#2A3446] text-[#A4B1CD] transition-colors hover:border-[#9FEF00] hover:text-white disabled:opacity-40"
                aria-label="Next operators"
                onClick={() => setWindowStart((s) => s + 10)}
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 h-px w-full bg-[#232C3D]" role="presentation" />

        <div className="mt-4 h-[220px] md:h-[300px]" role="img" aria-label="Operator score progression chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
              <defs>
                <filter id="lp-sb-line-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid vertical={false} stroke="#232C3D" />
              <XAxis
                type="number"
                dataKey="time"
                domain={["dataMin", "dataMax"]}
                ticks={xTicks}
                tickFormatter={(t) => {
                  for (const team of chartSeries) {
                    const p = team.series.find((s) => s.time === t);
                    if (p?.label) {
                      const [d, tm] = p.label.split("\n");
                      return `${d ?? ""} ${tm ?? ""}`.trim().toUpperCase();
                    }
                  }
                  return "";
                }}
                tick={{ fill: "#6B7891", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={0}
                height={48}
              />
              <YAxis
                domain={[0, yMax]}
                ticks={yTicks}
                tickFormatter={formatPointsK}
                tick={{ fill: "#6B7891", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<ChartTooltip operators={chartSeries} />} />
              {chartSeries.map((team) => {
                if (hidden.has(team.id)) {
                  return null;
                }
                const dim =
                  highlightId != null && highlightId !== team.id ? 0.15 : 1;
                const lineData = team.series.map((p) => ({
                  time: p.time,
                  points: p.points,
                  teamId: team.id,
                }));
                return (
                  <Line
                    key={team.id}
                    data={lineData}
                    type="stepAfter"
                    dataKey="points"
                    name={team.name}
                    stroke={team.color}
                    strokeWidth={2}
                    strokeOpacity={dim}
                    dot={{ r: 3, fill: team.color, strokeWidth: 0 }}
                    activeDot={{
                      r: 5,
                      fill: team.color,
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                    filter="url(#lp-sb-line-glow)"
                    isAnimationActive={false}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <ChartLegend
          operators={chartSeries}
          hidden={hidden}
          highlightId={highlightId}
          onToggle={toggleSeries}
          onHighlight={setHighlightId}
        />
      </div>
    </section>
  );
}
