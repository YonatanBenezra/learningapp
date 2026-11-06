"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock,
  Flame,
  Loader2,
  Lock,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { routes } from "@/config/routes";
import { DASHBOARD_TRACK_LABEL, simulatorToDashboardTrack } from "@/features/dashboard/dashboard-figma-utils";
import { cn } from "@/lib/utils";

/** Design tokens (HTB-style dashboard home) */
const C = {
  bg: "#0B1220",
  cardFrom: "#162236",
  cardTo: "#111A2B",
  tile: "#0E1626",
  border: "#1F2C42",
  border2: "#2A3A55",
  text: "#F2F5FA",
  muted: "#8597B3",
  dim: "#5B6C88",
  lime: "#A3F00A",
  limeInk: "#0D1A00",
  easy: "#5BC0F8",
  medium: "#F7C531",
  hard: "#F2667A",
  track: "#1F2C42",
} as const;

/** Same stack as `.lp-dash-htb-product--academy` (Products row) */
const ACADEMY_PRODUCT_PANEL_BG =
  "radial-gradient(ellipse 80% 65% at 100% 100%, rgb(159 239 0 / 22%) 0%, transparent 55%), linear-gradient(155deg, #131b29 0%, #161f30 55%, #141c28 100%)";

const DONUT = { size: 200, r: 84, stroke: 14, cx: 100, cy: 100 } as const;

export type DifficultyKey = "easy" | "medium" | "hard";

export type DifficultyBucket = {
  solved: number;
  total: number;
};

export type ProgressCardProps = {
  totalProblems: number;
  solvedCount: number;
  breakdown: Record<DifficultyKey, DifficultyBucket>;
  attempting: number;
  streakDays: number;
  acceptancePct: number;
};

export type DonutChartProps = {
  totalProblems: number;
  solvedCount: number;
  breakdown: Record<DifficultyKey, DifficultyBucket>;
};

export type DifficultyTileProps = {
  kind: DifficultyKey;
  bucket: DifficultyBucket;
};

export type StatCardProps = {
  icon: ComponentType<{ className?: string }>;
  iconTint: "amber" | "red" | "blue";
  label: string;
  valueLine: string;
  action?: ReactNode;
};

export type DailyDrillCardProps = {
  drillTitle: string;
  drillDescription: string;
  drillHref: string;
  drillSimulatorLabel: string;
  difficultyLabel: string;
  durationLabel: string;
  ctaLabel: string;
  tags?: { rag?: string };
};

export type BadgeGridProps = {
  earned: number;
  total: number;
  streakForMilestone: number;
  milestoneDays: number;
};

function monoClass() {
  return "font-[family-name:var(--font-jetbrains-mono),ui-monospace,monospace]";
}

export function DonutChart({ totalProblems, solvedCount, breakdown }: DonutChartProps) {
  const { cx, cy, r, stroke, size } = DONUT;
  const circ = 2 * Math.PI * r;
  const gap = Math.min(6, circ * 0.01);
  const segs = [
    { key: "easy" as const, count: breakdown.easy.solved, color: C.easy },
    { key: "medium" as const, count: breakdown.medium.solved, color: C.medium },
    { key: "hard" as const, count: breakdown.hard.solved, color: C.hard },
  ];
  const arcAvailable = Math.max(0, circ - gap * 3);
  let offset = 0;
  const circles = segs.map((s) => {
    const len =
      totalProblems > 0 ? Math.max(0, (s.count / totalProblems) * arcAvailable) : 0;
    const dash = `${len} ${circ - len}`;
    const o = offset;
    offset += len + gap;
    return (
      <circle
        key={s.key}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={s.color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={dash}
        strokeDashoffset={-o}
        className="origin-center"
      />
    );
  });

  const pct =
    totalProblems > 0 ? Math.round((solvedCount / totalProblems) * 1000) / 10 : 0;

  return (
    <div className="flex w-[200px] shrink-0 flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" aria-hidden>
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.track} strokeWidth={stroke} />
          {circles}
        </g>
      </svg>
      <div className="-mt-[200px] flex h-[200px] w-[200px] flex-col items-center justify-center text-center">
        <p className={cn("text-[28px] font-semibold leading-none tracking-tight text-[#F2F5FA]", monoClass())}>
          <span>{solvedCount}</span>
          <span className="text-base font-medium text-[#8597B3]"> / {totalProblems}</span>
        </p>
        <p
          className={cn(
            "mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8597B3]",
            monoClass(),
          )}
        >
          solved
        </p>
        <p className={cn("mt-2 text-xs font-medium text-[#A3F00A]", monoClass())}>{pct}% complete</p>
      </div>
    </div>
  );
}

export function DifficultyTile({ kind, bucket }: DifficultyTileProps) {
  const color = kind === "easy" ? C.easy : kind === "medium" ? C.medium : C.hard;
  const label = kind === "easy" ? "Easy" : kind === "medium" ? "Medium" : "Hard";
  const pct = bucket.total > 0 ? Math.round((bucket.solved / bucket.total) * 1000) / 10 : 0;
  const left = Math.max(0, bucket.total - bucket.solved);

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-2 rounded-xl border border-[#1F2C42] bg-[#0E1626] p-3 transition-transform duration-200",
        "hover:-translate-y-0.5 hover:border-[#2A3A55]",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
        <span className="text-sm font-semibold text-[#F2F5FA]">{label}</span>
      </div>
      <p className={cn("text-xl font-semibold tabular-nums text-[#F2F5FA]", monoClass())}>
        {bucket.solved} <span className="text-base font-medium text-[#8597B3]">/ {bucket.total}</span>
      </p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1F2C42]">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${bucket.total > 0 ? (bucket.solved / bucket.total) * 100 : 0}%`,
            background: color,
          }}
        />
      </div>
      <p className={cn("text-[11px] tabular-nums text-[#5B6C88]", monoClass())}>
        {pct}% · {left} left
      </p>
    </div>
  );
}

export function StatCard({ icon: Icon, iconTint, label, valueLine, action }: StatCardProps) {
  const tint =
    iconTint === "amber"
      ? "bg-[#F7C531]/12 text-[#F7C531] border-[#F7C531]/25"
      : iconTint === "red"
        ? "bg-[#F2667A]/12 text-[#F2667A] border-[#F2667A]/25"
        : "bg-[#5BC0F8]/12 text-[#5BC0F8] border-[#5BC0F8]/25";

  return (
    <div className="flex min-w-0 flex-1 gap-3 rounded-xl border border-[#1F2C42] bg-[#0E1626]/80 p-3">
      <div
        className={cn("flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg border", tint)}
      >
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-[#8597B3]">{label}</p>
        <p className="text-sm font-semibold text-[#F2F5FA]">{valueLine}</p>
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  );
}

export function ProgressCard({
  totalProblems,
  solvedCount,
  breakdown,
  attempting,
  streakDays,
  acceptancePct,
}: ProgressCardProps) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-6 rounded-sm border border-[#1e2939] p-6 text-[#F2F5FA]",
        "font-[family-name:var(--font-inter),var(--lp-font-sans),system-ui,sans-serif]",
      )}
      style={{ background: ACADEMY_PRODUCT_PANEL_BG }}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-[#F2F5FA]">Your progress</h2>
        <span
          className={cn(
            "rounded-lg border border-[#2A3A55] bg-[#0E1626] px-3 py-1.5 text-[12px] font-medium uppercase tracking-wider text-[#8597B3]",
            monoClass(),
          )}
        >
          {totalProblems} problems
        </span>
      </header>

      <div className="flex flex-col gap-5 min-[1000px]:flex-row min-[1000px]:items-stretch">
        <DonutChart totalProblems={totalProblems} solvedCount={solvedCount} breakdown={breakdown} />
        <div className="flex min-w-0 flex-1 flex-col gap-3 min-[640px]:flex-row">
          <DifficultyTile kind="easy" bucket={breakdown.easy} />
          <DifficultyTile kind="medium" bucket={breakdown.medium} />
          <DifficultyTile kind="hard" bucket={breakdown.hard} />
        </div>
      </div>

      <div className="grid gap-3 border-t border-[#1F2C42] pt-5 min-[640px]:grid-cols-3">
        <StatCard
          icon={Clock}
          iconTint="amber"
          label="In progress"
          valueLine={`${attempting} – unfinished`}
          action={
            <Link
              href={routes.practiceHub}
              className={cn(
                "inline-flex h-8 items-center gap-1 rounded-lg border border-[#2A3A55] bg-transparent px-2.5 text-[12px] font-semibold text-[#F2F5FA] transition-colors",
                "hover:border-[#A3F00A]/35 hover:bg-[#A3F00A]/8",
                monoClass(),
              )}
            >
              Resume
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          }
        />
        <StatCard icon={Flame} iconTint="red" label="Current streak" valueLine={`${streakDays} days`} />
        <StatCard
          icon={Check}
          iconTint="blue"
          label="Acceptance"
          valueLine={`${acceptancePct}%`}
        />
      </div>
    </section>
  );
}

function useUtcCountdown() {
  const [parts, setParts] = useState({ h: 0, m: 0 });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const next = new Date(now);
      next.setUTCHours(24, 0, 0, 0);
      const ms = Math.max(0, next.getTime() - now.getTime());
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      setParts({ h, m });
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return parts;
}

export function DailyDrillCard({
  drillTitle,
  drillDescription,
  drillHref,
  drillSimulatorLabel,
  difficultyLabel,
  durationLabel,
  ctaLabel,
}: DailyDrillCardProps) {
  const { h, m } = useUtcCountdown();

  return (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-6 rounded-sm border border-[#1e2939] p-6 text-[#F2F5FA]",
        "font-[family-name:var(--font-inter),var(--lp-font-sans),system-ui,sans-serif]",
      )}
      style={{ background: ACADEMY_PRODUCT_PANEL_BG }}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Daily drill</h2>
        <div className={cn("flex items-center gap-2", monoClass())}>
          <span className="rounded-lg border border-[#2A3A55] bg-[#0E1626] px-2.5 py-1.5 text-sm font-semibold tabular-nums text-[#F2F5FA]">
            {h}h
          </span>
          <span className="rounded-lg border border-[#2A3A55] bg-[#0E1626] px-2.5 py-1.5 text-sm font-semibold tabular-nums text-[#F2F5FA]">
            {m}m
          </span>
        </div>
      </header>

      <div
        className="flex flex-col gap-4 rounded-xl border p-5"
        style={{
          borderColor: "rgba(163, 240, 10, 0.25)",
          background:
            "linear-gradient(145deg, rgba(163, 240, 10, 0.06) 0%, rgba(14, 22, 38, 0.95) 48%, rgba(17, 26, 43, 0.98) 100%)",
        }}
      >
        <div className="flex flex-wrap gap-2">
          <span
            className={cn(
              "rounded-md border border-[#A3F00A]/35 bg-[#A3F00A]/10 px-2 py-0.5 text-[11px] font-semibold text-[#A3F00A]",
              monoClass(),
            )}
          >
            {drillSimulatorLabel}
          </span>
          <span
            className={cn(
              "rounded-md border border-[#5BC0F8]/30 bg-[#5BC0F8]/10 px-2 py-0.5 text-[11px] font-semibold text-[#5BC0F8]",
              monoClass(),
            )}
          >
            {difficultyLabel}
          </span>
          <span
            className={cn(
              "rounded-md border border-[#2A3A55] bg-[#0E1626] px-2 py-0.5 text-[11px] font-medium text-[#5B6C88]",
              monoClass(),
            )}
          >
            {durationLabel}
          </span>
        </div>
        <div>
          <h3 className="text-[18px] font-semibold leading-snug text-[#F2F5FA]">{drillTitle}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#8597B3]">{drillDescription}</p>
        </div>
        <Link
          href={drillHref}
          className={cn(
            "flex h-[46px] w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition-[filter,transform] duration-200",
            "bg-[#A3F00A] text-[#0D1A00] shadow-[0_10px_28px_rgba(163,240,10,0.22)] hover:brightness-105 active:scale-[0.99]",
            monoClass(),
          )}
        >
          {ctaLabel}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <BadgeGrid earned={0} total={12} streakForMilestone={0} milestoneDays={3} />
    </section>
  );
}

export function BadgeGrid({ earned, total, streakForMilestone, milestoneDays }: BadgeGridProps) {
  const filled = Math.min(milestoneDays, streakForMilestone);
  const lockedIcons = [Shield, Sparkles, Zap, Loader2] as const;

  return (
    <div className="border-t border-[#1F2C42] pt-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-[#F2F5FA]">Badges</h3>
        <p className={cn("text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8597B3]", monoClass())}>
          {earned} / {total} earned
        </p>
      </div>
      <div className="grid grid-cols-6 gap-2">
        <div
          className={cn(
            "relative flex aspect-square items-center justify-center rounded-xl border-2 border-[#A3F00A] bg-[#0E1626]",
          )}
        >
          <Loader2 className="h-5 w-5 animate-spin text-[#A3F00A]" aria-hidden />
          <span className="sr-only">Next badge</span>
        </div>
        {lockedIcons.map((Ic, i) => (
          <div
            key={i}
            className="relative flex aspect-square items-center justify-center rounded-xl border border-[#1F2C42] bg-[#0E1626] text-[#5B6C88]"
          >
            <Ic className="h-5 w-5 opacity-70" aria-hidden />
            <Lock className="absolute bottom-1 right-1 h-3 w-3 text-[#8597B3]" aria-hidden />
          </div>
        ))}
        <div className="flex aspect-square items-center justify-center rounded-xl border border-[#2A3A55] bg-[#0E1626] text-sm font-bold text-[#8597B3]">
          +7
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <p className={cn("text-[11px] font-medium text-[#8597B3]", monoClass())}>
          Next: {milestoneDays}-day streak
        </p>
        <div className="flex items-center gap-3">
          <div className="flex flex-1 gap-1">
            {Array.from({ length: milestoneDays }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 flex-1 rounded-sm",
                  i < filled ? "bg-[#A3F00A]" : "bg-[#1F2C42]",
                )}
              />
            ))}
          </div>
          <span className={cn("text-[11px] tabular-nums text-[#5B6C88]", monoClass())}>
            {filled}/{milestoneDays}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Map loaded dashboard data into the screenshot-accurate progress + drill row. */
export function DashboardHtbProgressDrillRow({
  totalProblems,
  solvedCount,
  breakdown,
  attempting,
  streakDays,
  progressAttempts,
  drill,
  drillExerciseBrief,
}: {
  totalProblems: number;
  solvedCount: number;
  breakdown: Record<DifficultyKey, DifficultyBucket>;
  attempting: number;
  streakDays: number;
  progressAttempts: number;
  drill: {
    slug: string;
    title: string;
    difficulty: string;
    simulator: string;
    completed: boolean;
  } | null;
  drillExerciseBrief: string | null;
}) {
  const acceptancePct =
    progressAttempts > 0 ? Math.min(100, Math.round((solvedCount / progressAttempts) * 100)) : 0;

  const mappedTrack = simulatorToDashboardTrack(drill?.simulator ?? "");
  const drillSim = mappedTrack ?? "rag";
  const drillSimulatorLabel = DASHBOARD_TRACK_LABEL[drillSim];
  const diffLabel =
    drill?.difficulty === "E" ? "Easy" : drill?.difficulty === "M" ? "Medium" : drill?.difficulty === "H" ? "Hard" : "Easy";

  const drillTitle = drill?.title ?? "Retrieval Top-K Baseline";
  const drillDescription =
    drillExerciseBrief?.replace(/\s+/g, " ").trim().slice(0, 160) ||
    "Today's curated problem from the hidden set.";
  const drillHref = drill ? routes.exercise(drill.slug) : routes.practiceHub;
  const ctaLabel = drill?.completed ? "Review daily drill" : "Start daily drill";

  return (
    <div className="max-[999px]:rounded-2xl max-[999px]:border max-[999px]:border-[#1F2C42] max-[999px]:bg-[#0B1220] max-[999px]:p-5">
      <div className="grid min-[1000px]:grid-cols-[1.6fr_1fr] gap-5">
        <ProgressCard
          totalProblems={totalProblems}
          solvedCount={solvedCount}
          breakdown={breakdown}
          attempting={attempting}
          streakDays={streakDays}
          acceptancePct={acceptancePct}
        />
        <DailyDrillCard
          drillTitle={drillTitle}
          drillDescription={drillDescription}
          drillHref={drillHref}
          drillSimulatorLabel={drillSimulatorLabel}
          difficultyLabel={diffLabel}
          durationLabel="~8 min"
          ctaLabel={ctaLabel}
        />
      </div>
    </div>
  );
}
