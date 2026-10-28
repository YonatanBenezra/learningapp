"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceDot,
} from "recharts";
import { useReducedMotion } from "motion/react";
import {
  buildProgressionChartData,
  formatElapsedMinutes,
  progressionAriaSummary,
  type ProgressionSeries,
} from "@/lib/arena/scoreboard";

function LastDot(props: {
  cx?: number;
  cy?: number;
  index?: number;
  dataLength: number;
  stroke?: string;
}) {
  const { cx, cy, index, dataLength, stroke } = props;
  if (index !== dataLength - 1 || cx == null || cy == null) {
    return null;
  }
  return <circle cx={cx} cy={cy} r={4} fill={stroke} stroke="none" />;
}

function YouLabel(props: { viewBox?: { x?: number; y?: number }; value?: number }) {
  const { viewBox, value } = props;
  const x = (viewBox?.x ?? 0) + 8;
  const y = (viewBox?.y ?? 0) - 8;
  return (
    <foreignObject x={x} y={y} width={120} height={28}>
      <span className="inline-flex rounded bg-[color-mix(in_srgb,var(--arena-lime)_15%,transparent)] px-[7px] py-[3px] font-mono text-[10.5px] font-bold text-[var(--arena-lime-fg)]">
        you · {value?.toLocaleString() ?? ""}
      </span>
    </foreignObject>
  );
}

export function ProgressionChart({ series }: { series: ProgressionSeries[] }) {
  const reduce = useReducedMotion();
  const data = useMemo(() => buildProgressionChartData(series, 180), [series]);
  const summary = progressionAriaSummary(series);

  const youSeries = series.find((s) => s.isYou);
  const youLast = youSeries?.points.at(-1);

  const tickMinutes = [0, 45, 90, 135, 180];

  return (
    <section className="flex h-full min-h-[220px] flex-col gap-3 rounded-xl border border-[var(--arena-line)] bg-[var(--arena-surface)] p-5 lg:min-h-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--arena-text-3)]">
          Score progression
        </h2>
        <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
          {series.map((s) => (
            <li key={s.user} className="flex items-center gap-1.5">
              <span
                className="h-[3px] w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
                aria-hidden
              />
              <span className="font-mono text-[11px] text-[var(--arena-text-2)]">
                {s.isYou ? "you" : s.user}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div
        className="min-h-[220px] flex-1 lg:min-h-[250px]"
        role="img"
        aria-label={summary}
      >
        <ResponsiveContainer width="100%" height="100%" minHeight={220}>
          <LineChart data={data} margin={{ top: 8, right: 48, left: 0, bottom: 4 }}>
            <CartesianGrid
              vertical={false}
              stroke="color-mix(in srgb, var(--arena-ink) 6%, transparent)"
              strokeWidth={1}
            />
            <XAxis
              dataKey="minute"
              type="number"
              domain={[0, 180]}
              ticks={tickMinutes}
              tickFormatter={(m) => formatElapsedMinutes(Number(m))}
              tick={{ fill: "var(--arena-text-3)", fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 5000]}
              ticks={[0, 1250, 2500, 3750, 5000]}
              width={44}
              tick={{ fill: "var(--arena-text-3)", fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--arena-surface)",
                border: "1px solid var(--arena-line-2)",
                borderRadius: 8,
                padding: 10,
                fontFamily: "var(--font-geist-mono)",
                fontSize: 11.5,
                color: "var(--arena-ink)",
              }}
              labelFormatter={(m) => formatElapsedMinutes(Number(m))}
              formatter={(value, name) => [
                typeof value === "number" ? value.toLocaleString() : String(value ?? ""),
                name === "you" ? "you" : String(name),
              ]}
            />
            {series.map((s) => (
              <Line
                key={s.user}
                type="stepAfter"
                dataKey={s.user}
                stroke={s.color}
                strokeWidth={s.isYou ? 2.5 : 1.6}
                strokeOpacity={s.isYou ? 1 : 0.8}
                dot={(props) => (
                  <LastDot {...props} dataLength={data.length} stroke={s.color} />
                )}
                activeDot={{ r: 4 }}
                isAnimationActive={!reduce}
                animationDuration={reduce ? 0 : 800}
              />
            ))}
            {youLast ? (
              <ReferenceDot
                x={youLast.t}
                y={youLast.score}
                r={0}
                label={<YouLabel value={youLast.score} />}
                ifOverflow="extendDomain"
              />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <table className="sr-only">
        <caption>Score progression data</caption>
        <thead>
          <tr>
            <th scope="col">Minutes</th>
            {series.map((s) => (
              <th key={s.user} scope="col">
                {s.isYou ? "you" : s.user}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.minute}>
              <td>{formatElapsedMinutes(row.minute)}</td>
              {series.map((s) => (
                <td key={s.user}>{row[s.user]?.toLocaleString() ?? "0"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
