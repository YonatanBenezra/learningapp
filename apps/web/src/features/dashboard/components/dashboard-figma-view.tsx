"use client";

import { motion, useReducedMotion, type Transition } from "motion/react";
import {
  ArrowRight,
  ChevronRight,
  FileText,
  Layers,
  Lock,
  Shield,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { routes } from "@/config/routes";
import { authApi } from "@/features/auth/auth-api";
import { useAuthSession } from "@/features/auth/use-auth-session";
import {
  DASHBOARD_TRACK_LABEL,
  displayName,
  utcMidnightResetLabel,
  type DashboardTrackKey,
} from "@/features/dashboard/dashboard-figma-utils";
import { problemsApi } from "@/features/problems/problems-api";
import { progressApi } from "@/features/progress/progress-api";
import {
  attemptingCount,
  difficultyBreakdown,
  passedSlugs,
} from "@/features/progress/progress-stats";
import { ApiError } from "@/lib/api-client";
import type { Exercise } from "@/types/exercise";
import type { Progress } from "@/types/progress";
import type { User } from "@/types/user";
import "../dashboard-figma.css";
import { DashboardHtbNav } from "@/features/dashboard/components/dashboard-htb-nav";
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
  id,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  id?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      id={id}
      className={className}
      initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.5, ease: E, delay }}
    >
      {children}
    </motion.div>
  );
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

export function DashboardFigmaView() {
  const reduceMotion = useReducedMotion();
  const { user: sessionUser } = useAuthSession();
  const [user, setUser] = useState<User | null>(sessionUser);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [problems, setProblems] = useState<Exercise[]>([]);
  const [drillReset, setDrillReset] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.workspace = "dashboard";
    return () => {
      delete document.documentElement.dataset.workspace;
    };
  }, []);

  useEffect(() => {
    setUser(sessionUser);
  }, [sessionUser]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, prog, list] = await Promise.all([
          authApi.me(),
          progressApi.getMine(),
          problemsApi.list(200),
        ]);
        if (cancelled) {
          return;
        }
        setUser(me);
        setProgress(prog);
        setProblems(list.items);
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
  const drill = progress?.dailyDrill;
  const drillExercise = drill ? problems.find((p) => p.slug === drill.slug) : null;

  const streak = progress?.streak.current ?? 0;
  const firstName = displayName(user ?? { id: "", email: "", role: "learner" }).split(" ")[0];

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
  const welcomeHandle = profileSlug ?? firstName.toLowerCase();
  const recommended = problems.slice(0, 4);

  return (
    <div className="lp-dash-figma lp-dash-figma--htb">
      <DashboardHtbNav user={user} />

      <div className="lp-dash-figma-main">
        <header className="lp-dash-htb-welcome">
          <div>
            <h1 className="lp-dash-htb-welcome-title">Welcome, {welcomeHandle}</h1>
            <p className="lp-dash-htb-welcome-role">
              Your current role is: <span className="font-medium text-[#9FEF00]">Engineering Student</span>
              <button type="button" className="lp-dash-htb-welcome-add">
                + add focus areas
              </button>
            </p>
          </div>
          {profileSlug && user.profile?.published ? (
            <Link href={routes.profile(profileSlug)} className="lp-dash-figma-btn lp-dash-figma-btn--ghost">
              View Profile
            </Link>
          ) : (
            <Link href={routes.account} className="lp-dash-figma-btn lp-dash-figma-btn--ghost">
              View Profile
            </Link>
          )}
        </header>

        <section className="lp-dash-htb-recommended" aria-labelledby="dash-recommended-title">
          <h2 id="dash-recommended-title" className="lp-dash-htb-section-title">
            Recommended for you
          </h2>
          <div className="lp-dash-htb-recommended-track">
            {recommended.map((ex, i) => (
              <Link
                key={ex.slug}
                href={routes.exercise(ex.slug)}
                className={`lp-dash-htb-rec-card lp-dash-htb-rec-card--${i % 4}`}
              >
                <span className="lp-dash-htb-rec-badge">
                  {ex.simulator === "rag" ? "MODULE" : ex.simulator === "guardrails" ? "LAB" : "CHALLENGE"}
                </span>
                <p className="lp-dash-htb-rec-title">{ex.title}</p>
                <p className="lp-dash-htb-rec-meta">
                  {ex.difficulty === "E" ? "Easy" : ex.difficulty === "M" ? "Medium" : "Hard"}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="lp-dash-htb-products" aria-labelledby="dash-products-title">
          <h2 id="dash-products-title" className="lp-dash-htb-section-title">
            Products
          </h2>
          <div className="lp-dash-htb-products-grid">
            <Link
              href={routes.problems}
              className="lp-dash-htb-product lp-dash-htb-product--academy lp-dash-htb-product--promo-academy"
            >
              <div className="lp-dash-htb-product-promo-body">
                <p className="lp-dash-htb-product-kicker">
                  LabPath <strong>Academy</strong>
                </p>
                <h3 className="lp-dash-htb-product-promo-title">Learn and get certified</h3>
                <p className="lp-dash-htb-product-promo-copy">
                  Build skills from the ground up with guided paths and{" "}
                  <span className="lp-dash-htb-product-promo-em">industry-ready certifications.</span>
                </p>
                <span className="lp-dash-htb-product-cta">Learn now</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/dashboard/labpath-academy-hero.jpg"
                alt=""
                className="lp-dash-htb-product-promo-art"
                width={440}
                height={520}
              />
            </Link>
            <Link
              href={routes.practiceHub}
              className="lp-dash-htb-product lp-dash-htb-product--labs lp-dash-htb-product--promo-labs"
            >
              <div className="lp-dash-htb-product-promo-body">
                <p className="lp-dash-htb-product-kicker">
                  LabPath <strong>Labs</strong>
                </p>
                <h3 className="lp-dash-htb-product-promo-title">Hands-on practice</h3>
                <p className="lp-dash-htb-product-promo-copy">
                  Attack real-world vulnerabilities and incidents with{" "}
                  <span className="lp-dash-htb-product-promo-em">new labs added weekly.</span>
                </p>
                <span className="lp-dash-htb-product-cta">Hack now</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/dashboard/labpath-labs-hero.png"
                alt=""
                className="lp-dash-htb-product-promo-art"
                width={440}
                height={520}
              />
            </Link>
            <Link
              href={routes.leaderboard}
              className="lp-dash-htb-product-side lp-dash-htb-product-side--leaderboard lp-dash-htb-product--leaderboard"
            >
              <div className="lp-dash-htb-product-leaderboard-shine" aria-hidden />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/dashboard/labpath-leaderboard-hero.jpg"
                alt=""
                className="lp-dash-htb-product-leaderboard-art"
                width={320}
                height={380}
              />
              <div className="lp-dash-htb-product-leaderboard-body">
                <p className="lp-dash-htb-product-kicker">
                  LabPath <strong>Rankings</strong>
                </p>
                <h3 className="lp-dash-htb-product-leaderboard-title">Leaderboard</h3>
                <p className="lp-dash-htb-product-leaderboard-copy">
                  See where you stand and{" "}
                  <span className="lp-dash-htb-product-promo-em">track your climb.</span>
                </p>
                <span className="lp-dash-htb-product-leaderboard-cta">View ranks</span>
              </div>
            </Link>
            <Link
              href={routes.contestHub}
              className="lp-dash-htb-product lp-dash-htb-product--contests lp-dash-htb-product--promo-contests"
            >
              <div className="lp-dash-htb-product-promo-body">
                <p className="lp-dash-htb-product-kicker">
                  LabPath{" "}
                  <strong className="lp-dash-htb-product-kicker-mark">Contests</strong>
                </p>
                <h3 className="lp-dash-htb-product-promo-title">Timed sprints</h3>
                <p className="lp-dash-htb-product-promo-copy">
                  Compete with the community in live events and{" "}
                  <span className="lp-dash-htb-product-promo-em">climb the global ranks.</span>
                </p>
                <span className="lp-dash-htb-product-cta">Join now</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/dashboard/labpath-contests-hero.jpg"
                alt=""
                className="lp-dash-htb-product-promo-art"
                width={440}
                height={520}
              />
            </Link>
          </div>
        </section>

        <div className="lp-dash-figma-grid">
          <div className="lp-dash-figma-col lp-dash-figma-col--main">
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
