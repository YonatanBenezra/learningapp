"use client";

import { useReducedMotion } from "motion/react";
import {
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  Code2,
  Cpu,
  FlaskConical,
  Hexagon,
  Layers,
  Network,
  Shield,
  Sparkles,
  Target,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { routes } from "@/config/routes";
import { authApi } from "@/features/auth/auth-api";
import { useAuthSession } from "@/features/auth/use-auth-session";
import { displayName } from "@/features/dashboard/dashboard-figma-utils";
import { problemsApi } from "@/features/problems/problems-api";
import { progressApi } from "@/features/progress/progress-api";
import {
  attemptingCount,
  difficultyBreakdown,
  passedSlugs,
} from "@/features/progress/progress-stats";
import { profileWorkspaceApi } from "@/features/profile/platform/profile-workspace-api";
import type { ProfileWorkspace } from "@/features/profile/platform/types";
import { ApiError } from "@/lib/api-client";
import type { Exercise } from "@/types/exercise";
import type { Progress } from "@/types/progress";
import type { User } from "@/types/user";
import "../dashboard-figma.css";
import { DashboardFigmaSkeleton } from "./dashboard-figma-skeleton";
import { DashboardHtbProgressDrillRow } from "./dashboard-htb-progress-drill";

const RECOMMENDED_CARD_VARIANTS = 6;

const RECOMMENDED_CARD_ICONS: LucideIcon[] = [
  Sparkles,
  Shield,
  Layers,
  Brain,
  Cpu,
  Network,
  Target,
  Hexagon,
  Code2,
  Zap,
  FlaskConical,
  BookOpen,
];

function hashSlugToPositiveInt(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (Math.imul(31, h) + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function RecommendedCardIcon({ slug }: { slug: string }) {
  const Icon = RECOMMENDED_CARD_ICONS[hashSlugToPositiveInt(slug) % RECOMMENDED_CARD_ICONS.length];
  return (
    <span className="lp-dash-htb-rec-icon" aria-hidden>
      <Icon size={22} strokeWidth={2.1} />
    </span>
  );
}

export function DashboardFigmaView() {
  const reduceMotion = useReducedMotion();
  const { user: sessionUser } = useAuthSession();
  const [me, setMe] = useState<User | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [problems, setProblems] = useState<Exercise[]>([]);
  const [profileWorkspace, setProfileWorkspace] = useState<ProfileWorkspace | null>(null);
  const [error, setError] = useState(false);
  const recommendedTrackRef = useRef<HTMLDivElement>(null);
  const [canScrollRecLeft, setCanScrollRecLeft] = useState(false);
  const [canScrollRecRight, setCanScrollRecRight] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.workspace = "dashboard";
    return () => {
      delete document.documentElement.dataset.workspace;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [profile, prog, list, workspaceResult] = await Promise.all([
          authApi.me(),
          progressApi.getMine(),
          problemsApi.list(200),
          profileWorkspaceApi.get().catch(() => null),
        ]);
        if (cancelled) {
          return;
        }
        setMe(profile);
        setProgress(prog);
        setProblems(list.items);
        setProfileWorkspace(workspaceResult);
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

  const user = me ?? sessionUser;
  const ready = Boolean(user && progress && problems.length > 0);

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

  const firstName = displayName(user ?? { id: "", email: "", role: "learner" }).split(" ")[0];

  const updateRecommendedScrollState = useCallback(() => {
    const el = recommendedTrackRef.current;
    if (!el) {
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    setCanScrollRecLeft(scrollLeft > 2);
    setCanScrollRecRight(scrollLeft < maxScroll - 2);
  }, []);

  useLayoutEffect(() => {
    updateRecommendedScrollState();
  }, [updateRecommendedScrollState, problems.length, ready]);

  useEffect(() => {
    const el = recommendedTrackRef.current;
    if (!el) {
      return;
    }
    el.addEventListener("scroll", updateRecommendedScrollState, { passive: true });
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateRecommendedScrollState) : null;
    ro?.observe(el);
    window.addEventListener("resize", updateRecommendedScrollState);
    return () => {
      el.removeEventListener("scroll", updateRecommendedScrollState);
      window.removeEventListener("resize", updateRecommendedScrollState);
      ro?.disconnect();
    };
  }, [updateRecommendedScrollState, ready]);

  const scrollRecommended = useCallback(
    (direction: -1 | 1) => {
      const el = recommendedTrackRef.current;
      if (!el) {
        return;
      }
      const step = Math.max(220, Math.floor(el.clientWidth * 0.82));
      el.scrollBy({
        left: direction * step,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    },
    [reduceMotion],
  );

  if (error) {
    return (
      <div className="lp-dash-figma-page">
        <p className="lp-dash-figma-loading">Could not load dashboard. Refresh to try again.</p>
      </div>
    );
  }

  if (!ready) {
    return <DashboardFigmaSkeleton />;
  }
  if (!user || !progress) {
    return <DashboardFigmaSkeleton />;
  }

  const profileSlug = user.profile?.slug;
  const welcomeHandle = profileSlug ?? firstName.toLowerCase();
  const recommendedCount = Math.min(7, problems.length);
  const recommended = problems.slice(0, recommendedCount);

  const designation = profileWorkspace?.accountSettings?.jobTitle?.trim() ?? "";

  return (
    <div className="lp-dash-figma-page">
      <div className="lp-dash-figma-main">
        <header className="lp-dash-htb-welcome">
          <div>
            <h1 className="lp-dash-htb-welcome-title">Welcome, {welcomeHandle}</h1>
            <p className="lp-dash-htb-welcome-role">
              Your title:{" "}
              {designation ? (
                <span className="lp-dash-htb-welcome-role-accent font-medium">{designation}</span>
              ) : (
                <Link
                  href={`${routes.dashboardSettings}#career`}
                  className="lp-dash-htb-welcome-role-accent font-medium underline decoration-[#9fef00]/35 underline-offset-2 hover:decoration-[#9fef00]/70"
                >
                  Add in settings
                </Link>
              )}{" "}
              <Link href={routes.dashboardProfile} className="lp-dash-htb-welcome-add">
                + add focus areas
              </Link>
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
          <div className="lp-dash-htb-recommended-header">
            <h2 id="dash-recommended-title" className="lp-dash-htb-section-title">
              Recommended for you
            </h2>
            <div className="lp-dash-htb-rec-scroll-group" role="group" aria-label="Scroll recommendations">
              <button
                type="button"
                className="lp-dash-htb-rec-scroll-btn"
                onClick={() => scrollRecommended(-1)}
                disabled={!canScrollRecLeft}
                aria-label="Scroll recommendations left"
              >
                <ChevronLeft size={20} strokeWidth={2.25} aria-hidden />
              </button>
              <button
                type="button"
                className="lp-dash-htb-rec-scroll-btn"
                onClick={() => scrollRecommended(1)}
                disabled={!canScrollRecRight}
                aria-label="Scroll recommendations right"
              >
                <ChevronRight size={20} strokeWidth={2.25} aria-hidden />
              </button>
            </div>
          </div>
          <div ref={recommendedTrackRef} className="lp-dash-htb-recommended-track">
            {recommended.map((ex, i) => (
              <Link
                key={ex.slug}
                href={routes.exercise(ex.slug)}
                className={`lp-dash-htb-rec-card lp-dash-htb-rec-card--${i % RECOMMENDED_CARD_VARIANTS}`}
              >
                <div className="lp-dash-htb-rec-card-head">
                  <span className="lp-dash-htb-rec-badge">
                    {ex.simulator === "rag" ? "MODULE" : ex.simulator === "guardrails" ? "LAB" : "CHALLENGE"}
                  </span>
                  <RecommendedCardIcon slug={ex.slug} />
                </div>
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
              href={routes.practiceHub}
              className="lp-dash-htb-product lp-dash-htb-product--academy lp-dash-htb-product--promo-academy"
            >
              <div className="lp-dash-htb-product-promo-body">
                <p className="lp-dash-htb-product-kicker">
                  LabPath <strong>Practice</strong>
                </p>
                <h3 className="lp-dash-htb-product-promo-title">Start a lab</h3>
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
                  LabPath <strong>Practice</strong>
                </p>
                <h3 className="lp-dash-htb-product-promo-title">Your lab workspace</h3>
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
              href={routes.dashboardRanking}
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
                  LabPath <strong>Ranking</strong>
                </p>
                <h3 className="lp-dash-htb-product-leaderboard-title">Ranking</h3>
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
                <h3 className="lp-dash-htb-product-promo-title">CTF hub</h3>
                <p className="lp-dash-htb-product-promo-copy">
                  Compete with the community in live contests and{" "}
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

        <DashboardHtbProgressDrillRow
          totalProblems={totalProblems}
          solvedCount={solvedCount}
          breakdown={{
            easy: { solved: breakdown.easy.solved, total: breakdown.easy.total },
            medium: { solved: breakdown.medium.solved, total: breakdown.medium.total },
            hard: { solved: breakdown.hard.solved, total: breakdown.hard.total },
          }}
          attempting={attempting}
          streakDays={progress?.streak.current ?? 0}
          progressAttempts={progress?.attempts ?? 0}
          drill={
            drill
              ? {
                  slug: drill.slug,
                  title: drill.title,
                  difficulty: drill.difficulty,
                  simulator: drill.simulator,
                  completed: drill.completed,
                }
              : null
          }
          drillExerciseBrief={drillExercise?.briefMd ?? null}
        />
      </div>
    </div>
  );
}
