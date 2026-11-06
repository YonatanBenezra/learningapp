"use client";

import { Award, Download, Link2, Lock } from "lucide-react";
import Link from "next/link";
import { useCallback, useId, useMemo } from "react";
import toast from "react-hot-toast";
import { routes } from "@/config/routes";
import type { PublicProfile } from "@/types/profile";
import type { SkillScore } from "@/types/progress";
import { cn } from "@/lib/utils";

/** Design tokens — employer public profile */
const T = {
  bg: "#07090D",
  panel: "#0D1117",
  panel2: "#11161E",
  border: "#1C232E",
  border2: "#28313F",
  text: "#EDEFF3",
  muted: "#8A93A3",
  dim: "#555F70",
  lime: "#B6F23A",
  limeInk: "#0A1000",
  violet: "#9B8CFF",
  cyan: "#4FD1E0",
  amber: "#FFB547",
} as const;

const RADAR_LABELS_FALLBACK = [
  "Chunking",
  "Planning",
  "Retrieval",
  "Evaluation reading",
  "Harness variance",
  "Prompt craft",
  "Safety review",
  "Guardrails",
  "Observability",
  "CI eval",
  "Data hygiene",
  "Tool use",
] as const;

function initialsFromName(name: string): string {
  const p = name.trim().split(/\s+/);
  if (p.length >= 2) return `${p[0][0] ?? ""}${p[1][0] ?? ""}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "LP";
}

function titleInitials(title: string): string {
  const w = title.trim().split(/\s+/).filter(Boolean);
  if (w.length >= 2) return `${w[0][0] ?? ""}${w[1][0] ?? ""}`.toUpperCase();
  return title.slice(0, 2).toUpperCase() || "—";
}

function formatSnapshotDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function formatSolveDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(d).toUpperCase();
}

function minDaysSincePractice(skills: SkillScore[]): number | null {
  const scored = skills.filter((s) => s.score > 0 && s.daysSincePractice != null);
  if (scored.length === 0) return null;
  return Math.min(...scored.map((s) => s.daysSincePractice as number));
}

function lastPassDaysAgo(recent: PublicProfile["recent"]): number | null {
  if (!recent.length) return null;
  const latest = recent.reduce((a, b) =>
    new Date(a.passedAt) > new Date(b.passedAt) ? a : b,
  );
  const t = new Date(latest.passedAt).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

type DecayStatus = "fresh" | "fading" | "stale";

function decayFromDays(days: number | null): { status: DecayStatus; label: string; daysLabel: string } {
  if (days === null) {
    return { status: "fresh", label: "Fresh", daysLabel: "—" };
  }
  let status: DecayStatus;
  if (days < 14) status = "fresh";
  else if (days <= 30) status = "fading";
  else status = "stale";
  const daysLabel = `${days} day${days === 1 ? "" : "s"} ago`;
  const label =
    status === "fresh" ? "Fresh" : status === "fading" ? "Fading" : "Stale";
  return { status, label, daysLabel };
}

/** 12-axis radar: plain SVG */
export function SkillRadar({
  skills,
  className,
}: {
  skills: { label: string; value: number; scored: boolean }[];
  className?: string;
}) {
  const gradId = `ep-radar-${useId().replace(/:/g, "")}`;
  const n = 12;
  const cx = 140;
  const cy = 140;
  const rMax = 118;
  const rings = [0.25, 0.5, 0.75, 1];
  const anyScored = skills.slice(0, n).some((s) => s.scored);

  const angle = (i: number) => (-Math.PI / 2 + (i * 2 * Math.PI) / n);
  const point = (i: number, radius: number) => {
    const a = angle(i);
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  };

  const polyPoints = skills
    .slice(0, n)
    .map((s, i) => {
      const rr = s.scored ? Math.max(0.08, s.value) * rMax : 0;
      const p = point(i, rr);
      return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <div className={cn("w-full", className)}>
      <svg viewBox="0 0 280 280" className="mx-auto w-full max-w-[280px]" aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={T.lime} stopOpacity="0.55" />
            <stop offset="100%" stopColor={T.lime} stopOpacity="0.12" />
          </linearGradient>
        </defs>
        {rings.map((k) => (
          <circle
            key={k}
            cx={cx}
            cy={cy}
            r={rMax * k}
            fill="none"
            stroke={T.border2}
            strokeWidth={1}
            opacity={0.65}
          />
        ))}
        {Array.from({ length: n }, (_, i) => {
          const outer = point(i, rMax);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={outer.x}
              y2={outer.y}
              stroke={T.border2}
              strokeWidth={1}
              opacity={0.5}
            />
          );
        })}
        {anyScored ? (
          <polygon
            points={polyPoints}
            fill={`url(#${gradId})`}
            stroke={T.lime}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ) : null}
        {skills.slice(0, n).map((s, i) => {
          const rr = s.scored ? Math.max(0.08, s.value) * rMax : rMax * 0.92;
          const p = point(i, rr);
          return s.scored ? (
            <circle key={i} cx={p.x} cy={p.y} r={5} fill={T.lime} />
          ) : (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={4.5}
              fill="none"
              stroke={T.dim}
              strokeWidth={1.5}
            />
          );
        })}
      </svg>
      <div
        className="relative mx-auto mt-2 grid max-w-[320px] gap-y-1 text-center text-[10px] leading-tight sm:text-[11px]"
        style={{
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        }}
      >
        {skills.slice(0, n).map((s, i) => (
          <span
            key={i}
            className={cn(
              "px-0.5",
              s.scored ? "font-semibold text-[#EDEFF3]" : "font-normal",
              s.scored ? "" : "text-[#555F70]",
            )}
            style={{
              fontFamily: "var(--font-ep-body), var(--font-inter), system-ui, sans-serif",
            }}
          >
            {s.label}
          </span>
        ))}
      </div>
      <div
        className="mt-4 flex flex-wrap items-center justify-center gap-6 text-xs"
        style={{ fontFamily: "var(--font-ep-mono), ui-monospace, monospace", color: T.muted }}
      >
        <span className="inline-flex items-center gap-2">
          <span className="inline-block size-2.5 rounded-sm" style={{ background: T.lime }} />
          Scored
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block size-2.5 rounded-full border"
            style={{ borderColor: T.dim }}
          />
          Not yet scored
        </span>
      </div>
    </div>
  );
}

export function RatingGauge({
  pct,
  rating,
  subtitle,
}: {
  pct: number;
  rating: number;
  subtitle: string;
}) {
  const size = 64;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * c;

  return (
    <div
      className="flex items-center gap-4 rounded-sm border p-4"
      style={{
        background: T.panel2,
        borderColor: T.border,
      }}
    >
      <svg width={size} height={size} className="shrink-0" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.border} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={T.lime}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill={T.lime}
          fontSize="13"
          fontWeight="700"
          style={{ fontFamily: "var(--font-ep-heading), system-ui, sans-serif" }}
        >
          {Math.round(Math.min(100, Math.max(0, pct)))}%
        </text>
      </svg>
      <div className="min-w-0">
        <p
          className="text-[11px] font-medium uppercase tracking-[0.14em]"
          style={{ color: T.muted, fontFamily: "var(--font-ep-mono), monospace" }}
        >
          Practice rating
        </p>
        <p
          className="text-[28px] font-bold leading-none tracking-tight"
          style={{
            color: T.text,
            fontFamily: "var(--font-ep-heading), system-ui, sans-serif",
          }}
        >
          {rating}
        </p>
        <p className="mt-1 text-xs" style={{ color: T.dim, fontFamily: "var(--font-ep-body), sans-serif" }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

export function TrustLadder({
  tier1Count,
  tier2Line,
  tier2Tag,
  tier3Count,
}: {
  tier1Count: number;
  tier2Line: string;
  tier2Tag: string;
  tier3Count: number;
}) {
  const tiers = [
    {
      key: "t1",
      bar: T.violet,
      label: "TIER 1",
      value: tier1Count,
      title: "Verified assessments",
      tag: "SIGNED · NO DECAY",
    },
    {
      key: "t2",
      bar: T.lime,
      label: "TIER 2",
      value: tier2Line,
      title: "Practice radar",
      tag: tier2Tag,
    },
    {
      key: "t3",
      bar: T.cyan,
      label: "TIER 3",
      value: tier3Count,
      title: "Raw practice depth",
      tag: "ACTIVITY",
    },
  ] as const;

  return (
    <div className="grid gap-4 min-[760px]:grid-cols-3">
      {tiers.map((t) => (
        <div
          key={t.key}
          className="flex min-h-[140px] flex-col overflow-hidden rounded-sm border"
          style={{ background: T.panel, borderColor: T.border }}
        >
          <div className="h-[3px] w-full" style={{ background: t.bar }} />
          <div className="flex flex-1 flex-col p-5">
            <p
              className="text-[10px] font-semibold tracking-[0.16em]"
              style={{ color: T.dim, fontFamily: "var(--font-ep-mono), monospace" }}
            >
              {t.label}
            </p>
            <p
              className="mt-2 text-2xl font-bold leading-none sm:text-[28px]"
              style={{ fontFamily: "var(--font-ep-heading), system-ui, sans-serif", color: T.text }}
            >
              {t.value}
            </p>
            <p className="mt-2 text-sm leading-snug" style={{ color: T.muted, fontFamily: "var(--font-ep-body), sans-serif" }}>
              {t.title}
            </p>
            <span
              className="mt-auto inline-flex w-fit rounded-sm px-2 py-1 text-[10px] font-semibold tracking-wide"
              style={{
                background: `${t.bar}14`,
                color: t.bar,
                fontFamily: "var(--font-ep-mono), monospace",
              }}
            >
              {t.tag}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CoverageGrid({
  skills,
  decayDays,
}: {
  skills: { label: string; scored: boolean }[];
  decayDays: number | null;
}) {
  const scored = skills.filter((s) => s.scored).length;
  const total = skills.length || 12;
  const pct = total > 0 ? Math.round((scored / total) * 100) : 0;
  const decay = decayFromDays(decayDays);

  return (
    <div className="flex h-full flex-col rounded-sm border p-5" style={{ background: T.panel, borderColor: T.border }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3
            className="text-sm font-semibold"
            style={{ fontFamily: "var(--font-ep-heading), sans-serif", color: T.text }}
          >
            Coverage
          </h3>
        </div>
        <span className="text-xs" style={{ color: T.dim, fontFamily: "var(--font-ep-mono), monospace" }}>
          {scored} / {total} scored
        </span>
      </div>
      <p
        className="mt-4 text-3xl font-bold tabular-nums sm:text-4xl"
        style={{ fontFamily: "var(--font-ep-heading), sans-serif", color: T.text }}
      >
        {pct}%
        <span className="ml-2 text-base font-medium sm:text-lg" style={{ color: T.muted }}>
          of skills
        </span>
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {skills.slice(0, 12).map((s, i) => (
          <div
            key={i}
            className="flex h-10 items-center justify-center rounded-sm border px-1 text-center text-[10px] font-medium leading-tight"
            style={{
              borderColor: s.scored ? `${T.lime}55` : T.border,
              background: s.scored ? `${T.lime}10` : T.panel2,
              color: s.scored ? T.text : T.dim,
              fontFamily: "var(--font-ep-body), sans-serif",
            }}
          >
            {s.label.slice(0, 14)}
            {s.label.length > 14 ? "…" : ""}
          </div>
        ))}
      </div>
      <div
        className="mt-auto flex gap-2 rounded-sm border p-3"
        style={{
          borderColor: `${T.amber}45`,
          background: `${T.amber}08`,
        }}
      >
        <span className="text-lg leading-none" aria-hidden>
          ⚠
        </span>
        <p className="text-xs leading-relaxed" style={{ color: T.muted, fontFamily: "var(--font-ep-body), sans-serif" }}>
          {decayDays === null ? (
            <>No practice signal on the radar yet.</>
          ) : (
            <>
              Last practice <strong style={{ color: T.amber }}>{decay.daysLabel}</strong>. Radar scores are{" "}
              <strong style={{ color: T.text }}>{decay.label.toLowerCase()}</strong>
              {decay.status !== "fresh" ? " — consider refreshing skills." : "."}
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export function VerifiedCard({ results }: { results: PublicProfile["verifiedResults"] }) {
  const steps = [
    "Timed sitting — learner completes assessments without outside help.",
    "Graded by LabPath — scores are signed and tamper-evident.",
    "Learner opts in — nothing appears here unless explicitly shared.",
  ];

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-sm border p-5 sm:p-6"
      style={{
        borderColor: T.border,
        background: `linear-gradient(165deg, ${T.violet}12 0%, ${T.panel} 42%, ${T.panel} 100%)`,
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ background: T.violet }} />
        <span
          className="text-[10px] font-bold tracking-[0.18em]"
          style={{ color: T.violet, fontFamily: "var(--font-ep-mono), monospace" }}
        >
          TIER 1 · VERIFIED
        </span>
      </div>
      <h3
        className="text-lg font-semibold"
        style={{ fontFamily: "var(--font-ep-heading), sans-serif", color: T.text }}
      >
        Assessment results
      </h3>
      {results.length === 0 ? (
        <div className="mt-8 flex flex-col items-center text-center">
          <div
            className="flex size-16 items-center justify-center rounded-full border-2 border-dashed"
            style={{ borderColor: `${T.violet}55` }}
          >
            <Award className="size-7" style={{ color: T.violet }} strokeWidth={1.75} aria-hidden />
          </div>
          <p
            className="mt-4 text-sm font-semibold"
            style={{ color: T.text, fontFamily: "var(--font-ep-heading), sans-serif" }}
          >
            Nothing shared yet
          </p>
          <p className="mt-2 max-w-[280px] text-xs leading-relaxed" style={{ color: T.muted, fontFamily: "var(--font-ep-body), sans-serif" }}>
            Results come from timed, no-hints sittings. When the learner shares one, it will show up here
            with a verify link.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {results.map((r) => (
            <li
              key={r.id}
              className="rounded-sm border p-4"
              style={{ borderColor: T.border2, background: T.panel2 }}
            >
              <p className="text-sm font-semibold" style={{ color: T.text, fontFamily: "var(--font-ep-heading), sans-serif" }}>
                {r.assessmentSlug}
              </p>
              <p className="mt-1 text-[11px]" style={{ color: T.muted, fontFamily: "var(--font-ep-mono), monospace" }}>
                Issued {r.issuedAt.slice(0, 10)} · {r.bandLabel}
              </p>
              <Link
                href={routes.verifyResult(r.id)}
                className="mt-2 inline-block text-xs font-semibold underline underline-offset-2"
                style={{ color: T.violet }}
              >
                Verify this result
              </Link>
            </li>
          ))}
        </ul>
      )}
      <ol className="mt-8 space-y-4">
        {steps.map((line, i) => (
          <li key={i} className="flex gap-3">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{
                background: `${T.violet}22`,
                color: T.violet,
                fontFamily: "var(--font-ep-mono), monospace",
              }}
            >
              {i + 1}
            </span>
            <p className="text-xs leading-relaxed" style={{ color: T.muted, fontFamily: "var(--font-ep-body), sans-serif" }}>
              {line}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function EvidenceCard({
  attempts,
  uniqueSolves,
  recent,
}: {
  attempts: number;
  uniqueSolves: number;
  recent: PublicProfile["recent"];
}) {
  const maxW = Math.max(attempts, uniqueSolves, 1);
  const wAttempts = (attempts / maxW) * 100;
  const wSolves = (uniqueSolves / maxW) * 100;

  return (
    <div className="flex h-full flex-col rounded-sm border p-5 sm:p-6" style={{ background: T.panel, borderColor: T.border }}>
      <div className="mb-2 flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ background: T.cyan }} />
        <span
          className="text-[10px] font-bold tracking-[0.18em]"
          style={{ color: T.cyan, fontFamily: "var(--font-ep-mono), monospace" }}
        >
          TIER 3 · DEPTH
        </span>
      </div>
      <h3
        className="text-lg font-semibold"
        style={{ fontFamily: "var(--font-ep-heading), sans-serif", color: T.text }}
      >
        Practice evidence
      </h3>
      <div className="mt-6 space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between text-xs" style={{ color: T.muted, fontFamily: "var(--font-ep-mono), monospace" }}>
            <span>Attempts</span>
            <span>{attempts}</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-sm" style={{ background: T.panel2 }}>
            <div
              className="h-full rounded-sm"
              style={{
                width: `${wAttempts}%`,
                background: `linear-gradient(90deg, ${T.cyan}aa, ${T.cyan})`,
              }}
            />
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-xs" style={{ color: T.muted, fontFamily: "var(--font-ep-mono), monospace" }}>
            <span>Unique solves</span>
            <span>{uniqueSolves}</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-sm" style={{ background: T.panel2 }}>
            <div
              className="h-full rounded-sm"
              style={{
                width: `${wSolves}%`,
                background: `linear-gradient(90deg, ${T.lime}99, ${T.lime})`,
              }}
            />
          </div>
        </div>
      </div>
      <ul className="mt-6 flex flex-1 flex-col gap-3">
        {recent.length === 0 ? (
          <li className="text-xs" style={{ color: T.dim, fontFamily: "var(--font-ep-body), sans-serif" }}>
            No public solves yet.
          </li>
        ) : (
          recent.slice(0, 5).map((item) => (
            <li
              key={item.slug}
              className="flex items-center gap-3 rounded-sm border px-3 py-2.5"
              style={{ borderColor: T.border, background: T.panel2 }}
            >
              <div
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  background: `${T.cyan}18`,
                  color: T.cyan,
                  fontFamily: "var(--font-ep-mono), monospace",
                }}
              >
                {titleInitials(item.title)}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-medium"
                  style={{ color: T.text, fontFamily: "var(--font-ep-body), sans-serif" }}
                >
                  {item.title}
                </p>
                <p className="text-[11px]" style={{ color: T.dim, fontFamily: "var(--font-ep-body), sans-serif" }}>
                  Solved
                </p>
              </div>
              <time
                className="shrink-0 text-[11px] tabular-nums"
                style={{ color: T.muted, fontFamily: "var(--font-ep-mono), monospace" }}
                dateTime={item.passedAt}
              >
                {formatSolveDate(item.passedAt)}
              </time>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export function ProfileSidebar({
  profile,
  displayName,
  handle,
  practicePct,
  printable,
}: {
  profile: PublicProfile;
  displayName: string;
  handle: string;
  practicePct: number;
  printable: boolean;
}) {
  const scored = profile.skills.filter((s) => s.score > 0).length;
  const totalSkills = 12;
  const contestRatingDisplay =
    profile.contestRating == null ? null : profile.contestRating;

  const copyLink = useCallback(() => {
    if (typeof window === "undefined" || printable) return;
    void navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success("Link copied");
    });
  }, [printable]);

  const downloadReport = useCallback(() => {
    if (printable) return;
    window.open(routes.profileReport(profile.slug), "_blank", "noopener,noreferrer");
  }, [profile.slug, printable]);

  return (
    <aside className="min-[1040px]:sticky min-[1040px]:top-6">
      <div
        className="overflow-hidden rounded-sm border"
        style={{ background: T.panel, borderColor: T.border }}
      >
        <div
          className="relative h-24 overflow-hidden sm:h-[96px]"
          style={{
            background: `
              radial-gradient(ellipse 80% 90% at 85% 0%, ${T.violet}35 0%, transparent 55%),
              radial-gradient(ellipse 70% 80% at 10% 100%, ${T.lime}25 0%, transparent 50%),
              ${T.panel2}
            `,
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: `radial-gradient(${T.border2} 1px, transparent 1px)`,
              backgroundSize: "10px 10px",
            }}
            aria-hidden
          />
        </div>
        <div className="relative px-5 pb-6 pt-0">
          <div
            className="relative -mt-9 flex size-[72px] items-center justify-center rounded-full border-4 text-xl font-bold"
            style={{
              borderColor: T.bg,
              background: T.panel2,
              color: T.lime,
              fontFamily: "var(--font-ep-heading), sans-serif",
            }}
          >
            {initialsFromName(displayName)}
          </div>
          <h2
            className="mt-4 text-2xl font-bold leading-tight"
            style={{ fontFamily: "var(--font-ep-heading), sans-serif", color: T.text }}
          >
            {displayName}
          </h2>
          <p
            className="mt-1 text-sm"
            style={{ color: T.muted, fontFamily: "var(--font-ep-mono), monospace" }}
          >
            @{handle}
          </p>
          <span
            className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide"
            style={{
              background: `${T.lime}18`,
              color: T.lime,
              fontFamily: "var(--font-ep-mono), monospace",
            }}
          >
            <span className="text-[9px]">●</span> EMPLOYER VIEW
          </span>
          <div className="mt-5">
            <RatingGauge
              pct={practicePct}
              rating={profile.practiceRating}
              subtitle="Solves + recency"
            />
          </div>
          <dl className="mt-5 space-y-0 border-t pt-4" style={{ borderColor: T.border }}>
            {(
              [
                ["Contest rating", contestRatingDisplay === null ? "—" : String(contestRatingDisplay)],
                ["Shared results", String(profile.verifiedResults.length)],
                ["Day streak", `${profile.streak.current} · best ${profile.streak.longest}`],
                ["Skills scored", `${scored}/${totalSkills}`],
              ] as const
            ).map(([k, v], idx, arr) => {
              const isZeroish =
                (k === "Contest rating" && contestRatingDisplay === null) ||
                (k === "Shared results" && profile.verifiedResults.length === 0) ||
                (k === "Day streak" && profile.streak.current === 0);
              return (
                <div key={k}>
                  <div className="flex items-baseline justify-between gap-3 py-3">
                    <dt className="text-xs font-medium" style={{ color: T.muted, fontFamily: "var(--font-ep-body), sans-serif" }}>
                      {k}
                    </dt>
                    <dd
                      className="text-right text-sm font-semibold tabular-nums"
                      style={{
                        color: isZeroish ? T.dim : T.text,
                        fontFamily: "var(--font-ep-heading), sans-serif",
                      }}
                    >
                      {v}
                    </dd>
                  </div>
                  {idx < arr.length - 1 ? (
                    <div
                      className="border-t border-dashed"
                      style={{ borderColor: T.border2 }}
                    />
                  ) : null}
                </div>
              );
            })}
          </dl>
          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={downloadReport}
              disabled={printable}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-sm px-4 py-3 text-sm font-bold transition-[filter] hover:brightness-110 disabled:opacity-50"
              style={{ background: T.lime, color: T.limeInk, fontFamily: "var(--font-ep-heading), sans-serif" }}
            >
              <Download className="size-4" strokeWidth={2.25} />
              Download report
            </button>
            <button
              type="button"
              onClick={copyLink}
              disabled={printable}
              className="inline-flex size-[46px] shrink-0 items-center justify-center rounded-sm border transition-colors hover:bg-white/5 disabled:opacity-50"
              style={{ borderColor: T.border2, color: T.text }}
              aria-label="Copy profile link"
            >
              <Link2 className="size-4" strokeWidth={2} />
            </button>
          </div>
          <div className="mt-5 flex gap-2">
            <Lock className="size-3.5 shrink-0" style={{ color: T.dim }} aria-hidden />
            <p className="text-[11px] leading-relaxed" style={{ color: T.dim, fontFamily: "var(--font-ep-body), sans-serif" }}>
              Nothing on this page is published without the learner&apos;s opt-in.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function buildRadarSkills(profile: PublicProfile): { label: string; value: number; scored: boolean }[] {
  const rows: { label: string; value: number; scored: boolean }[] = [];
  for (let i = 0; i < 12; i++) {
    const s = profile.skills[i];
    if (s) {
      const scored = s.score > 0;
      rows.push({
        label: s.name,
        value: scored ? Math.min(1, Math.max(0, s.score)) : 0,
        scored,
      });
    } else {
      rows.push({
        label: RADAR_LABELS_FALLBACK[i] ?? `Skill ${i + 1}`,
        value: 0,
        scored: false,
      });
    }
  }
  return rows;
}

export function EmployerPublicProfileLayout({
  profile,
  printable = false,
}: {
  profile: PublicProfile;
  printable?: boolean;
}) {
  const snapshot = useMemo(() => formatSnapshotDate(new Date()), []);

  const displayName = profile.displayName;
  const handle = profile.slug;
  const radarSkills = useMemo(() => buildRadarSkills(profile), [profile]);
  const coverageSkills = radarSkills.map((s) => ({ label: s.label, scored: s.scored }));
  const scoredCount = radarSkills.filter((s) => s.scored).length;

  const avgScored =
    scoredCount > 0
      ? radarSkills.filter((s) => s.scored).reduce((a, s) => a + s.value, 0) / scoredCount
      : 0;

  const practicePct = useMemo(() => {
    const cap = 1000;
    return Math.min(100, Math.round((profile.practiceRating / cap) * 100));
  }, [profile.practiceRating]);

  const decayDays = minDaysSincePractice(profile.skills) ?? lastPassDaysAgo(profile.recent);

  const tier2Decay = decayFromDays(decayDays);

  return (
    <div
      className="min-h-screen pb-16 pt-6 sm:pb-24 sm:pt-8"
      style={{ background: T.bg, color: T.text }}
    >
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-6 min-[1040px]:grid-cols-[300px_minmax(0,1fr)] min-[1040px]:gap-6">
          <ProfileSidebar
            profile={profile}
            displayName={displayName}
            handle={handle}
            practicePct={practicePct}
            printable={printable}
          />

          <main className="min-w-0 space-y-4">
            <div
              className="flex flex-col gap-3 rounded-sm border px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-5"
              style={{ background: T.panel, borderColor: T.border }}
            >
              <p className="text-xs tabular-nums sm:text-right" style={{ color: T.dim, fontFamily: "var(--font-ep-mono), monospace" }}>
                Snapshot · {snapshot}
              </p>
            </div>

            <div className="space-y-4">
              <section
                className="rounded-sm border p-5 sm:p-6"
                style={{ background: T.panel, borderColor: T.border }}
                id="ep-signal"
              >
                <h2
                  className="text-lg font-bold tracking-tight sm:text-xl"
                  style={{ fontFamily: "var(--font-ep-heading), sans-serif", color: T.text }}
                >
                  Signal strength
                </h2>
                <p className="mt-1 text-sm" style={{ color: T.muted, fontFamily: "var(--font-ep-body), sans-serif" }}>
                  How much to trust each number
                </p>
                <div className="mt-6">
                  <TrustLadder
                    tier1Count={profile.verifiedResults.length}
                    tier2Line={`${scoredCount} skills · Practice radar, avg ${avgScored.toFixed(2)}`}
                    tier2Tag={
                      tier2Decay.status === "fresh"
                        ? "FRESH · DECAYS OVER TIME"
                        : tier2Decay.status === "fading"
                          ? "FADING · DECAYS OVER TIME"
                          : "STALE · DECAYS OVER TIME"
                    }
                    tier3Count={profile.attempts}
                  />
                </div>
              </section>

              <div className="grid grid-cols-1 gap-4 min-[760px]:grid-cols-6 min-[760px]:gap-4">
                <section
                  className="min-[760px]:col-span-4 rounded-sm border p-5 sm:p-6"
                  style={{ background: T.panel, borderColor: T.border }}
                  id="ep-radar"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: T.lime, fontFamily: "var(--font-ep-mono), monospace" }}>
                        Practice radar
                      </p>
                      <h3 className="mt-1 text-lg font-bold" style={{ fontFamily: "var(--font-ep-heading), sans-serif", color: T.text }}>
                        Skill shape
                      </h3>
                    </div>
                    <span className="text-xs font-medium" style={{ color: T.muted, fontFamily: "var(--font-ep-mono), monospace" }}>
                      {scoredCount} / 12 scored
                    </span>
                  </div>
                  <div className="mt-6">
                    <SkillRadar skills={radarSkills} />
                  </div>
                </section>
                <div className="min-[760px]:col-span-2" id="ep-coverage">
                  <CoverageGrid skills={coverageSkills} decayDays={decayDays} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 min-[760px]:grid-cols-6 min-[760px]:gap-4">
                <div className="min-[760px]:col-span-3" id="ep-verified">
                  <VerifiedCard results={profile.verifiedResults} />
                </div>
                <div className="min-[760px]:col-span-3" id="ep-evidence">
                  <EvidenceCard
                    attempts={profile.attempts}
                    uniqueSolves={profile.solves}
                    recent={profile.recent}
                  />
                </div>
              </div>
            </div>

            <footer className="pt-4 text-center text-[11px]" style={{ color: T.dim, fontFamily: "var(--font-ep-body), sans-serif" }}>
              <Link href={routes.home} className="underline decoration-[#555F70] underline-offset-2 hover:decoration-[#8A93A3]">
                LabPath
              </Link>{" "}
              — signals are indicative, not a certification.
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}

export const EmployerProfileContent = EmployerPublicProfileLayout;
