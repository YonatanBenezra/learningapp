"use client";

import {
  LayoutGroup,
  motion,
  useReducedMotion,
  type Transition,
} from "motion/react";
import {
  Activity,
  ArrowRight,
  Calendar,
  Check,
  ChevronRight,
  FileText,
  Layers,
  LineChart,
  Lock,
  Search,
  Shield,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { routes } from "@/config/routes";
import { authApi } from "@/features/auth/auth-api";
import { LogoutButton } from "@/features/auth/logout-button";
import { ThemeToggle } from "@/features/theme/theme-toggle";
import { authUserInitials, useAuthSession } from "@/features/auth/use-auth-session";
import {
  allSubmissionRows,
  continueExerciseSlug,
  continueLabelFromSlug,
  dashboardEyebrowDate,
  DASHBOARD_TRACK_LABEL,
  DASHBOARD_TRACK_ORDER,
  displayName,
  formatJoinMonth,
  formatShortDate,
  groupSkillsForDashboard,
  greetingForHour,
  recentPasses,
  trackPassCounts,
  utcMidnightResetLabel,
  type DashboardTrackKey,
} from "@/features/dashboard/dashboard-figma-utils";
import { leaderboardApi } from "@/features/leaderboard/leaderboard-api";
import { problemsApi } from "@/features/problems/problems-api";
import { progressApi } from "@/features/progress/progress-api";
import {
  activeDays,
  attemptingCount,
  buildHeatmap,
  difficultyBreakdown,
  maxStreakFromHeatmap,
  passedSlugs,
  totalSubmissions,
} from "@/features/progress/progress-stats";
import { ApiError } from "@/lib/api-client";
import type { Exercise } from "@/types/exercise";
import type { Progress } from "@/types/progress";
import type { User } from "@/types/user";
import "../dashboard-figma.css";
import { DashboardFigmaSkeleton } from "./dashboard-figma-skeleton";

const E: Transition["ease"] = [0.2, 0, 0, 1];

function useCountUp(target: number, delay: number, duration: number, enabled: boolean) {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(reduceMotion || !enabled ? target : 0);

  useEffect(() => {
    if (reduceMotion || !enabled) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now() + delay * 1000;
    const tick = (now: number) => {
      if (now < start) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, (now - start) / (duration * 1000));
      setValue(Math.round(target * t));
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, delay, duration, enabled, reduceMotion]);

  return value;
}

function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.5, ease: E, delay }}
    >
      {children}
    </motion.div>
  );
}

const TRACK_ICON: Record<DashboardTrackKey, typeof Shield> = {
  guard: Shield,
  rag: FileText,
  eval: LineChart,
  prompt: Layers,
};

const DIFF_LABEL = { E: "Easy", M: "Medium", H: "Hard" } as const;

function heatLevel(count: number) {
  if (count <= 0) {
    return 0;
  }
  if (count === 1) {
    return 1;
  }
  if (count === 2) {
    return 2;
  }
  return 3;
}

function SolvedRing({
  total,
  solved,
  breakdown,
  delay,
}: {
  total: number;
  solved: number;
  breakdown: { easy: number; medium: number; hard: number };
  delay: number;
}) {
  const reduceMotion = useReducedMotion();
  const r = 58;
  const cx = 66;
  const cy = 66;
  const circumference = 2 * Math.PI * r;
  const gap = (2 / 360) * circumference;
  const segments = [
    { count: breakdown.easy, color: "var(--teal)" },
    { count: breakdown.medium, color: "var(--amber)" },
    { count: breakdown.hard, color: "var(--red)" },
  ];
  let cumulative = 0;
  const solvedDisplay = useCountUp(solved, delay + 0.2, 0.8, true);
  const arcEls = segments.map((seg, index) => {
    const len = total > 0 ? Math.max(0, (seg.count / total) * circumference - gap) : 0;
    if (len <= 0) {
      return null;
    }
    const offset = cumulative;
    cumulative += len + gap;
    const dash = `${len} ${circumference - len}`;
    const props = {
      cx,
      cy,
      r,
      fill: "none" as const,
      stroke: seg.color,
      strokeWidth: 8,
      strokeLinecap: "round" as const,
      strokeDasharray: dash,
      strokeDashoffset: -offset,
      transform: `rotate(-90 ${cx} ${cy})`,
    };
    return reduceMotion ? (
      <circle key={index} {...props} />
    ) : (
      <motion.circle
        key={index}
        {...props}
        initial={{ strokeDasharray: `0 ${circumference}` }}
        animate={{ strokeDasharray: dash }}
        transition={{ duration: 0.5, ease: E, delay: delay + 0.3 + index * 0.12 }}
      />
    );
  });

  return (
    <div className="lp-dash-figma-ring-wrap">
      <svg width="132" height="132" viewBox="0 0 132 132" aria-hidden>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--sunken)" strokeWidth={8} />
        {arcEls}
      </svg>
      <div className="lp-dash-figma-ring-center">
        <span className="lp-dash-figma-ring-num">{solvedDisplay}</span>
        <span className="lp-dash-figma-ring-denom">/{total}</span>
        <span className="lp-dash-figma-ring-label">solved</span>
      </div>
    </div>
  );
}

function heatmapWeekColumns(days: ReturnType<typeof buildHeatmap>) {
  if (days.length === 0) {
    return [];
  }
  const first = new Date(`${days[0].date}T12:00:00`);
  const pad = first.getDay();
  const padded: (typeof days[0] | null)[] = [...Array(pad).fill(null), ...days];
  const weeks: (typeof days)[] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(
      padded.slice(i, i + 7).map((cell) => cell ?? { date: "", count: 0 }),
    );
  }
  return weeks;
}

export function DashboardFigmaView() {
  const reduceMotion = useReducedMotion();
  const { user: sessionUser } = useAuthSession();
  const [user, setUser] = useState<User | null>(sessionUser);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [problems, setProblems] = useState<Exercise[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [tab, setTab] = useState<"recent" | "list" | "skills">("recent");
  const [drillReset, setDrillReset] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    setUser(sessionUser);
  }, [sessionUser]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, prog, list, board] = await Promise.all([
          authApi.me(),
          progressApi.getMine(),
          problemsApi.list(200),
          leaderboardApi.list().catch(() => null),
        ]);
        if (cancelled) {
          return;
        }
        setUser(me);
        setProgress(prog);
        setProblems(list.items);
        const slug = me.profile?.slug;
        if (slug && board) {
          const row = board.items.find((item) => item.slug === slug);
          if (row) {
            setRank(row.rank);
            setRating(row.rating);
          }
        }
      } catch (e) {
        if (!cancelled && !(e instanceof ApiError && e.status === 401)) {
          setError(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const tick = () => setDrillReset(utcMidnightResetLabel());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const ready = user && progress && problems.length > 0;

  const solvedSet = useMemo(
    () => (progress ? passedSlugs(progress.items) : new Set<string>()),
    [progress],
  );

  const breakdown = useMemo(
    () => difficultyBreakdown(problems, solvedSet),
    [problems, solvedSet],
  );

  const totalProblems = problems.length;
  const solvedCount = progress?.solves ?? solvedSet.size;
  const attempting = progress ? attemptingCount(progress.items, solvedSet) : 0;
  const acceptance =
    progress && progress.attempts > 0
      ? Math.round((solvedCount / progress.attempts) * 100)
      : 0;

  const tracks = useMemo(
    () => (progress ? trackPassCounts(progress.items, problems) : { rag: 0, eval: 0, guard: 0, prompt: 0 }),
    [progress, problems],
  );
  const trackMax = Math.max(1, ...DASHBOARD_TRACK_ORDER.map((k) => tracks[k]));

  const skills = useMemo(
    () => (progress ? groupSkillsForDashboard(progress.skills) : { advanced: [], fundamental: [] }),
    [progress],
  );

  const heatmapDays = useMemo(
    () => (progress ? buildHeatmap(progress.items, 371) : []),
    [progress],
  );
  const heatmapWeeks = useMemo(() => heatmapWeekColumns(heatmapDays), [heatmapDays]);
  const todayKey = new Date().toISOString().slice(0, 10);
  const heatTotal = totalSubmissions(heatmapDays);

  const continueSlug = progress ? continueExerciseSlug(progress.items, solvedSet) : null;
  const drill = progress?.dailyDrill;
  const drillExercise = drill ? problems.find((p) => p.slug === drill.slug) : null;

  const recentRows = useMemo(
    () => (progress ? recentPasses(progress.items, problems) : []),
    [progress, problems],
  );
  const listRows = useMemo(
    () => (progress ? allSubmissionRows(progress.items, problems) : []),
    [progress, problems],
  );

  const streak = progress?.streak.current ?? 0;
  const passedToday = progress?.dailyDrill?.completed ?? false;
  const streakNudge = streak > 0 && !passedToday;

  const greeting = greetingForHour(new Date().getHours());
  const firstName = displayName(user ?? { id: "", email: "", role: "learner" }).split(" ")[0];

  const attemptsDisplay = useCountUp(progress?.attempts ?? 0, 0.2, 0.8, Boolean(ready));
  const acceptedDisplay = useCountUp(solvedCount, 0.26, 0.8, Boolean(ready));
  const acceptanceDisplay = useCountUp(acceptance, 0.32, 0.8, Boolean(ready));
  const skillsCountDisplay = useCountUp(progress?.skills.length ?? 0, 0.38, 0.8, Boolean(ready));

  if (error) {
    return (
      <div className="lp-dash-figma">
        <p className="lp-dash-figma-loading">Could not load dashboard. Refresh to try again.</p>
      </div>
    );
  }

  if (!ready) {
    return <DashboardFigmaSkeleton />;
  }

  const profileSlug = user.profile?.slug;
  const joinLabel = formatJoinMonth(user);

  return (
    <div className="lp-dash-figma">
      <header className="lp-dash-figma-nav">
        <div className="lp-dash-figma-nav-inner">
          <Link href={routes.problems} className="lp-dash-figma-nav-search">
            <Search size={15} aria-hidden />
            Search problems
          </Link>
          <div className="lp-dash-figma-nav-actions">
            <ThemeToggle variant="nav" />
            <Link href={routes.account} className="lp-dash-figma-avatar" aria-label="Account">
              {authUserInitials(user)}
            </Link>
          </div>
        </div>
      </header>

      <div className="lp-dash-figma-main">
        <header className="lp-dash-figma-head">
          <FadeUp delay={0}>
            <p className="lp-dash-figma-eyebrow">Dashboard · {dashboardEyebrowDate()}</p>
            <h1 className="lp-dash-figma-greeting">
              {greeting}, {firstName}.
            </h1>
            <p className="lp-dash-figma-sub">
              {streak > 0
                ? `${streak}-day streak. ${passedToday ? "You kept it alive today." : "One pass today keeps it alive."}`
                : "Pass a problem to start your streak."}
            </p>
          </FadeUp>
          <FadeUp delay={0.15} className="lp-dash-figma-head-actions lp-dash-figma-head-actions--desktop">
            {profileSlug && user.profile?.published ? (
              <Link href={routes.profile(profileSlug)} className="lp-dash-figma-btn lp-dash-figma-btn--ghost">
                View public profile
              </Link>
            ) : (
              <Link href={routes.account} className="lp-dash-figma-btn lp-dash-figma-btn--ghost">
                Profile settings
              </Link>
            )}
            <Link
              href={
                continueSlug
                  ? routes.exercise(continueSlug)
                  : drill?.slug
                    ? routes.exercise(drill.slug)
                    : routes.problems
              }
              className="lp-dash-figma-btn lp-dash-figma-btn--ember"
            >
              Continue {continueSlug ? continueLabelFromSlug(continueSlug) : "practice"}
              <ArrowRight size={16} aria-hidden />
            </Link>
          </FadeUp>
        </header>

        <div className="lp-dash-figma-grid">
          <div className="lp-dash-figma-col lp-dash-figma-col--left">
            <FadeUp
              delay={0.15}
              className="lp-dash-figma-panel lp-dash-figma-panel--profile lp-dash-figma-card lp-dash-figma-card--pad-lg"
            >
              <div className="lp-dash-figma-profile-top">
                <div className="lp-dash-figma-profile-avatar">{authUserInitials(user)}</div>
                <div>
                  <p className="lp-dash-figma-profile-name">{displayName(user)}</p>
                  <p className="lp-dash-figma-profile-handle">
                    {profileSlug ? `@${profileSlug}` : "@you"}
                    {joinLabel ? ` · joined ${joinLabel}` : ""}
                  </p>
                </div>
              </div>
              <div className="lp-dash-figma-stat-strip">
                <div className="lp-dash-figma-stat-cell">
                  <span className="lp-dash-figma-stat-label">Rank</span>
                  <span className="lp-dash-figma-stat-val lp-dash-figma-stat-val--ember">
                    {rank != null ? `#${rank}` : "—"}
                  </span>
                </div>
                <div className="lp-dash-figma-stat-cell">
                  <span className="lp-dash-figma-stat-label">Rating</span>
                  <span className="lp-dash-figma-stat-val">{rating ?? "—"}</span>
                </div>
                <div className="lp-dash-figma-stat-cell">
                  <span className="lp-dash-figma-stat-label">Streak</span>
                  <span
                    className={`lp-dash-figma-stat-val${streakNudge ? " lp-dash-figma-stat-val--nudge" : ""}`}
                  >
                    {streak > 0 ? `${streak}d` : "—"}
                  </span>
                </div>
              </div>
              <div className="lp-dash-figma-profile-actions">
                <Link href={routes.account} className="lp-dash-figma-btn lp-dash-figma-btn--ghost">
                  Edit profile
                </Link>
                <a
                  href="https://github.com/"
                  className="lp-dash-figma-icon-btn"
                  aria-label="GitHub"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.48 0-.24-.01-.86-.01-1.7-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.86.09-.66.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05A9.2 9.2 0 0 1 12 6.84c.85.004 1.71.12 2.51.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.95-2.34 4.81-4.57 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.59.69.49A10.1 10.1 0 0 0 22 12.26C22 6.58 17.52 2 12 2z"
                    />
                  </svg>
                </a>
              </div>
            </FadeUp>

            <FadeUp delay={0.21} className="lp-dash-figma-panel lp-dash-figma-panel--activity lp-dash-figma-card">
              <div className="lp-dash-figma-card-head">
                <h2 className="lp-dash-figma-card-title">Activity</h2>
                <span className="lp-dash-figma-card-meta">
                  <Calendar size={12} aria-hidden className="lp-dash-figma-card-meta-icon" />
                  all time
                </span>
              </div>
              <div className="lp-dash-figma-tiles">
                <div className="lp-dash-figma-tile">
                  <Activity size={15} color="var(--text-2)" />
                  <span className="lp-dash-figma-tile-val">{attemptsDisplay}</span>
                  <span className="lp-dash-figma-tile-label">attempts</span>
                </div>
                <div className="lp-dash-figma-tile">
                  <Check size={15} color="var(--teal)" />
                  <span className="lp-dash-figma-tile-val">{acceptedDisplay}</span>
                  <span className="lp-dash-figma-tile-label">accepted</span>
                </div>
                <div className="lp-dash-figma-tile">
                  <LineChart size={15} color="var(--text-2)" />
                  <span className="lp-dash-figma-tile-val">{acceptanceDisplay}%</span>
                  <span className="lp-dash-figma-tile-label">acceptance</span>
                </div>
                <div className="lp-dash-figma-tile">
                  <Sparkles size={15} color="var(--ember)" />
                  <span className="lp-dash-figma-tile-val">{skillsCountDisplay}</span>
                  <span className="lp-dash-figma-tile-label">skills scored</span>
                </div>
              </div>
            </FadeUp>

            <FadeUp delay={0.27} className="lp-dash-figma-panel lp-dash-figma-panel--tracks lp-dash-figma-card">
              <div className="lp-dash-figma-card-head">
                <h2 className="lp-dash-figma-card-title">Tracks</h2>
                <span className="lp-dash-figma-card-meta">passes</span>
              </div>
              {DASHBOARD_TRACK_ORDER.map((track) => {
                const Icon = TRACK_ICON[track];
                const count = tracks[track];
                const pct = (count / trackMax) * 100;
                const color =
                  track === "rag"
                    ? "var(--ember)"
                    : track === "guard"
                      ? "var(--teal)"
                      : track === "eval"
                        ? "var(--blue)"
                        : "var(--amber)";
                return (
                  <div key={track} className="lp-dash-figma-track-row">
                    <Icon size={14} color="var(--text-2)" aria-hidden />
                    <span className="lp-dash-figma-track-name">{DASHBOARD_TRACK_LABEL[track]}</span>
                    <div className="lp-dash-figma-track-bar">
                      <motion.span
                        className="lp-dash-figma-track-fill"
                        style={{ background: color }}
                        initial={{ scaleX: reduceMotion ? 1 : 0 }}
                        animate={{ scaleX: count > 0 ? pct / 100 : 0 }}
                        transition={{ duration: 0.5, ease: E, delay: 0.35 }}
                      />
                    </div>
                    <span className="lp-dash-figma-track-val">{count}</span>
                  </div>
                );
              })}
            </FadeUp>

            <FadeUp delay={0.33} className="lp-dash-figma-panel lp-dash-figma-panel--skills lp-dash-figma-card">
              <div className="lp-dash-figma-card-head">
                <h2 className="lp-dash-figma-card-title">Skills</h2>
                <span className="lp-dash-figma-card-meta">{progress.skills.length} scored</span>
              </div>
              <div className="lp-dash-figma-skill-group">
                <p className="lp-dash-figma-skill-kicker">
                  <span className="lp-dash-figma-skill-kicker-dot lp-dash-figma-skill-kicker-dot--ember" />
                  Advanced
                </p>
                <div className="lp-dash-figma-chips">
                  {skills.advanced.length > 0 ? (
                    skills.advanced.map((s) => (
                      <span key={s.slug} className="lp-dash-figma-chip">
                        {s.slug}
                      </span>
                    ))
                  ) : (
                    <span className="lp-dash-figma-chip">—</span>
                  )}
                </div>
              </div>
              <div className="lp-dash-figma-skill-group">
                <p className="lp-dash-figma-skill-kicker">
                  <span className="lp-dash-figma-skill-kicker-dot lp-dash-figma-skill-kicker-dot--teal" />
                  Fundamental
                </p>
                <div className="lp-dash-figma-chips">
                  {skills.fundamental.length > 0 ? (
                    skills.fundamental.map((s) => (
                      <span key={s.slug} className="lp-dash-figma-chip">
                        {s.slug}
                      </span>
                    ))
                  ) : (
                    <span className="lp-dash-figma-chip">—</span>
                  )}
                </div>
              </div>
            </FadeUp>

            <FadeUp delay={0.36} className="lp-dash-figma-panel lp-dash-figma-panel--signout">
              <LogoutButton className="lp-dash-figma-signout" />
            </FadeUp>
          </div>

          <div className="lp-dash-figma-col lp-dash-figma-col--right">
            <div className="lp-dash-figma-row1">
              <FadeUp
                delay={0.2}
                className="lp-dash-figma-panel lp-dash-figma-panel--solved lp-dash-figma-card lp-dash-figma-card--pad-lg lp-dash-figma-solved"
              >
                <div className="lp-dash-figma-card-head">
                  <h2 className="lp-dash-figma-card-title">Solved</h2>
                  <span className="lp-dash-figma-card-meta lp-dash-figma-card-meta--desktop">
                    {totalProblems} problems
                  </span>
                  <Link
                    href={routes.problems}
                    className="lp-dash-figma-card-link lp-dash-figma-card-meta--mobile"
                  >
                    View all
                    <ChevronRight size={14} aria-hidden />
                  </Link>
                </div>
                <div className="lp-dash-figma-solved-body">
                  <SolvedRing
                    total={totalProblems}
                    solved={solvedCount}
                    delay={0.25}
                    breakdown={{
                      easy: breakdown.easy.solved,
                      medium: breakdown.medium.solved,
                      hard: breakdown.hard.solved,
                    }}
                  />
                  <div className="lp-dash-figma-diff-rows">
                    {(
                      [
                        ["Easy", "easy", breakdown.easy, "var(--teal)", "lp-dash-figma-diff-easy"],
                        ["Medium", "medium", breakdown.medium, "var(--amber)", "lp-dash-figma-diff-medium"],
                        ["Hard", "hard", breakdown.hard, "var(--red)", "lp-dash-figma-diff-hard"],
                      ] as const
                    ).map(([label, , bucket, color, cls], i) => (
                      <div key={label}>
                        <div className={`lp-dash-figma-diff-row-head ${cls}`}>
                          <span>{label}</span>
                          <span>
                            {bucket.solved}
                            <span style={{ color: "var(--text-3)" }}>/{bucket.total}</span>
                          </span>
                        </div>
                        <div className="lp-dash-figma-diff-bar">
                          <motion.span
                            className="lp-dash-figma-diff-fill"
                            style={{ background: color }}
                            initial={{ scaleX: reduceMotion ? 1 : 0 }}
                            animate={{
                              scaleX: bucket.total > 0 ? bucket.solved / bucket.total : 0,
                            }}
                            transition={{ duration: 0.45, ease: E, delay: 0.35 + i * 0.08 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {attempting > 0 ? (
                  <div className="lp-dash-figma-attempt-chip">
                    <span className="lp-dash-figma-attempt-dot" aria-hidden />
                    <span>{attempting} attempting</span>
                    <span style={{ color: "var(--text-3)" }}>· unfinished runs</span>
                  </div>
                ) : null}
              </FadeUp>

              <FadeUp
                delay={0.18}
                className="lp-dash-figma-panel lp-dash-figma-panel--drill lp-dash-figma-card lp-dash-figma-card--pad-lg lp-dash-figma-drill"
              >
                <div className="lp-dash-figma-card-head">
                  <h2 className="lp-dash-figma-card-title">Daily drill</h2>
                  <span className="lp-dash-figma-card-meta lp-dash-figma-card-meta--desktop">
                    {drillReset || "resets 00:00 UTC"}
                  </span>
                  <span className="lp-dash-figma-card-meta lp-dash-figma-card-meta--mobile">
                    Points 0 / 25 LPT
                  </span>
                </div>
                {drill ? (
                  <>
                    <div className="lp-dash-figma-drill-box">
                      <p className="lp-dash-figma-drill-kicker">
                        <FileText size={13} aria-hidden />
                        {(simulatorToTrackLabel(drill.simulator)
                          ? DASHBOARD_TRACK_LABEL[simulatorToTrackLabel(drill.simulator)!]
                          : "Practice")}{" "}
                        ·{" "}
                        {drill.difficulty === "E" ? "Easy" : drill.difficulty === "M" ? "Medium" : "Hard"} · ~8 min
                      </p>
                      <p className="lp-dash-figma-drill-title">{drill.title}</p>
                      <p className="lp-dash-figma-drill-desc">
                        {drillExercise?.briefMd?.replace(/\s+/g, " ").slice(0, 120) ||
                          "Today's curated problem from the hidden set."}
                      </p>
                    </div>
                    <Link
                      href={routes.exercise(drill.slug)}
                      className="lp-dash-figma-btn lp-dash-figma-btn--ember lp-dash-figma-drill-btn"
                    >
                      {drill.completed ? "Review daily drill" : "Start daily drill"}
                      <motion.span whileHover={reduceMotion ? undefined : { x: 3 }}>
                        <ArrowRight size={16} aria-hidden />
                      </motion.span>
                    </Link>
                  </>
                ) : (
                  <p className="lp-dash-figma-drill-desc">No drill available yet.</p>
                )}
                <div className="lp-dash-figma-badges-head">
                  <span className="lp-dash-figma-card-title">Badges</span>
                  <span className="lp-dash-figma-card-meta">0 / 12</span>
                </div>
                <div className="lp-dash-figma-badge-slots">
                  {[Sparkles, Shield, FileText, Lock, Layers].map((Icon, i) => (
                    <span key={i} className="lp-dash-figma-badge-slot" title="First badge at a 3-day streak">
                      <Icon size={15} />
                    </span>
                  ))}
                </div>
                <p className="lp-dash-figma-card-meta">
                  First badge at a 3-day streak
                  {streak > 0 ? ` — ${Math.max(0, 3 - streak)} day${3 - streak === 1 ? "" : "s"} away.` : "."}
                </p>
              </FadeUp>
            </div>

            <FadeUp
              delay={0.32}
              className="lp-dash-figma-panel lp-dash-figma-panel--heatmap lp-dash-figma-card lp-dash-figma-card--pad-lg"
            >
              <div className="lp-dash-figma-card-head">
                <h2 className="lp-dash-figma-card-title">{heatTotal} submissions in the past year</h2>
                <span className="lp-dash-figma-card-meta lp-dash-figma-card-meta--desktop">
                  {heatmapDays[0]?.date.slice(0, 7)} – {todayKey.slice(0, 7)}
                </span>
                <span className="lp-dash-figma-card-meta lp-dash-figma-card-meta--mobile">Last 52 weeks</span>
              </div>
              <div className="lp-dash-figma-heatmap-scroll">
                <div
                  className="lp-dash-figma-heatmap-grid"
                  style={{ gridTemplateColumns: `repeat(${heatmapWeeks.length}, 12px)` }}
                >
                  {heatmapWeeks.flatMap((week, wi) =>
                    week.map((day, di) => {
                      const level = heatLevel(day.count);
                      const isToday = day.date === todayKey;
                      return (
                        <motion.span
                          key={`${wi}-${di}-${day.date}`}
                          title={
                            day.date
                              ? `${day.count} submission${day.count === 1 ? "" : "s"} · ${formatShortDate(day.date)}`
                              : undefined
                          }
                          className={`lp-dash-figma-heatmap-cell${
                            level ? ` lp-dash-figma-heatmap-cell--l${level}` : ""
                          }${isToday ? " lp-dash-figma-heatmap-cell--today" : ""}`}
                          initial={
                            reduceMotion
                              ? undefined
                              : { opacity: 0, scale: 0.6 }
                          }
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            delay: reduceMotion ? 0 : (wi + di) * 0.006,
                            duration: 0.25,
                          }}
                        />
                      );
                    }),
                  )}
                </div>
              </div>
              <div className="lp-dash-figma-heatmap-foot">
                <span>
                  Active days <strong>{activeDays(heatmapDays)}</strong> · Max streak{" "}
                  <strong>{maxStreakFromHeatmap(heatmapDays)}</strong> · Current streak{" "}
                  <strong>{streak}</strong>
                </span>
                <span>Less ■■■■ More</span>
              </div>
            </FadeUp>

            <FadeUp
              delay={0.38}
              className="lp-dash-figma-panel lp-dash-figma-panel--recent lp-dash-figma-card lp-dash-figma-recent"
            >
              <div className="lp-dash-figma-recent-head">
                <LayoutGroup>
                  <div className="lp-dash-figma-segments" role="tablist">
                    {(
                      [
                        ["recent", "Recent AC"],
                        ["list", "All submissions"],
                        ["skills", "Skills"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={tab === id}
                        className={`lp-dash-figma-segment${tab === id ? " is-active" : ""}`}
                        onClick={() => setTab(id)}
                      >
                        {tab === id ? (
                          <motion.span
                            layoutId="dash-tab-pill"
                            className="lp-dash-figma-segment-pill"
                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                          />
                        ) : null}
                        <span className="lp-dash-figma-segment-label">
                          {id === "list" ? (
                            <>
                              <span className="lp-dash-figma-segment-text lp-dash-figma-segment-text--long">
                                All submissions
                              </span>
                              <span className="lp-dash-figma-segment-text lp-dash-figma-segment-text--short">All</span>
                            </>
                          ) : (
                            label
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </LayoutGroup>
                <Link href={routes.problems} className="lp-dash-figma-view-all">
                  View all
                  <ChevronRight size={14} aria-hidden />
                </Link>
              </div>

              {tab === "skills" ? (
                <div className="lp-dash-figma-chips" style={{ padding: "14px 24px" }}>
                  {progress.skills.map((s) => (
                    <span key={s.slug} className="lp-dash-figma-chip">
                      {s.name} · {Math.round(s.score * 100)}%
                    </span>
                  ))}
                </div>
              ) : (
                (tab === "recent" ? recentRows : listRows).map((row, index) => (
                  <motion.div
                    key={`${row.slug}-${row.passedAt}`}
                    initial={reduceMotion ? undefined : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <Link href={routes.exercise(row.slug)} className="lp-dash-figma-recent-row">
                      <span className="lp-dash-figma-recent-check">
                        {row.title && tab === "recent" ? <Check size={14} /> : <Activity size={14} />}
                      </span>
                      <div>
                        <p className="lp-dash-figma-recent-title">{row.title}</p>
                        <p className="lp-dash-figma-recent-meta">
                          {row.trackLabel} · {row.tries} {row.tries === 1 ? "try" : "tries"}
                        </p>
                      </div>
                      <span className={`lp-dash-figma-diff-pill lp-dash-figma-diff-pill--${row.difficulty}`}>
                        {DIFF_LABEL[row.difficulty]}
                      </span>
                      {tab === "recent" ? <span className="lp-dash-figma-pass">PASS</span> : null}
                      <span className="lp-dash-figma-recent-date">{formatShortDate(row.passedAt)}</span>
                    </Link>
                  </motion.div>
                ))
              )}
            </FadeUp>
          </div>
        </div>
      </div>
    </div>
  );
}

function simulatorToTrackLabel(simulator: string): DashboardTrackKey | null {
  switch (simulator) {
    case "rag":
      return "rag";
    case "guardrails":
      return "guard";
    case "evaluation":
      return "eval";
    case "prompt_engineering":
      return "prompt";
    default:
      return null;
  }
}
