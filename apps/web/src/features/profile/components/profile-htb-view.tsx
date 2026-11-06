"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  ExternalLink,
  Flame,
  MapPin,
  MoreHorizontal,
  Pencil,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { GlobalLoader } from "@/components/ui/global-loader";
import { routes } from "@/config/routes";
import { DashboardHtbNav } from "@/features/dashboard/components/dashboard-htb-nav";
import { displayName, formatShortDate } from "@/features/dashboard/dashboard-figma-utils";
import "@/features/dashboard/dashboard-figma.css";
import { authApi } from "@/features/auth/auth-api";
import { leaderboardApi } from "@/features/leaderboard/leaderboard-api";
import { rankTitleFromRating } from "@/features/leaderboard/leaderboard-figma-catalog";
import { progressApi } from "@/features/progress/progress-api";
import {
  activeDays,
  buildHeatmap,
  maxStreakFromHeatmap,
} from "@/features/progress/progress-stats";
import { ApiError } from "@/lib/api-client";
import type { Progress } from "@/types/progress";
import type { User } from "@/types/user";
import "../profile-htb.css";

type ProfileTab = "about" | "badges";

function heatLevel(count: number): 0 | 1 | 2 | 3 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  return 3;
}

function heatmapWeekColumns(days: ReturnType<typeof buildHeatmap>) {
  const weeks: (typeof days)[number][][] = [];
  let week: (typeof days)[number][] = [];
  for (const day of days) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    weeks.push(week);
  }
  return weeks;
}

function totalSubmissions(days: ReturnType<typeof buildHeatmap>) {
  return days.reduce((sum, day) => sum + day.count, 0);
}

function levelProgress(rating: number) {
  const xpPerLevel = 150;
  const level = Math.max(1, Math.floor(rating / xpPerLevel) + 1);
  const inLevel = rating % xpPerLevel;
  return { level, current: inLevel, next: xpPerLevel, pct: Math.min(100, (inLevel / xpPerLevel) * 100) };
}

function handleFromUser(user: User) {
  const slug = user.profile?.slug?.trim();
  if (slug) {
    return `@${slug}`;
  }
  const local = user.email.split("@")[0] ?? "learner";
  return `@${local}`;
}

function initialsForUser(user: User, name: string) {
  const source = name.trim() || user.email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function EmptyPanel({
  message,
  cta,
  href,
  onClick,
}: {
  message: string;
  cta: string;
  href?: string;
  onClick?: () => void;
}) {
  return (
    <div className="lp-profile-htb-empty">
      <p>{message}</p>
      {href ? (
        <Link href={href} className="lp-profile-htb-link">
          <Pencil size={14} aria-hidden />
          {cta}
        </Link>
      ) : (
        <button type="button" className="lp-profile-htb-link" onClick={onClick}>
          <Pencil size={14} aria-hidden />
          {cta}
        </button>
      )}
    </div>
  );
}

export function ProfileHtbView() {
  const reduceMotion = useReducedMotion();
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [rating, setRating] = useState(0);
  const [tab, setTab] = useState<ProfileTab>("about");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsActive, setSettingsActive] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [savePending, setSavePending] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [error, setError] = useState<"auth" | "load" | null>(null);

  useEffect(() => {
    document.documentElement.dataset.workspace = "profile";
    return () => {
      delete document.documentElement.dataset.workspace;
    };
  }, []);

  useEffect(() => {
    const syncHash = () => {
      const open = window.location.hash === "#profile-settings";
      setSettingsOpen(open);
      setSettingsActive(open);
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, prog, board] = await Promise.all([
          authApi.me(),
          progressApi.getMine(),
          leaderboardApi.list().catch(() => null),
        ]);
        if (cancelled) return;
        setUser(me);
        setProgress(prog);
        setDisplayNameInput(me.displayName ?? "");
        const slug = me.profile?.slug;
        if (slug && board) {
          const row = board.items.find((item) => item.slug === slug);
          if (row) setRating(row.rating);
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof ApiError && e.status === 401 ? "auth" : "load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const heatmapDays = useMemo(
    () => (progress ? buildHeatmap(progress.items, 371) : []),
    [progress],
  );
  const heatmapWeeks = useMemo(() => heatmapWeekColumns(heatmapDays), [heatmapDays]);
  const todayKey = new Date().toISOString().slice(0, 10);
  const heatTotal = totalSubmissions(heatmapDays);
  const xpTotal = rating > 0 ? rating : (progress?.solves ?? 0) * 40;
  const level = levelProgress(xpTotal);
  const rankTitle = rankTitleFromRating(rating || xpTotal);

  const weeklyAvg =
    heatmapDays.length > 0
      ? (heatTotal / Math.max(1, Math.ceil(heatmapDays.length / 7))).toFixed(1)
      : "0";

  async function onSaveProfile(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSavePending(true);
    setSaveMsg(null);
    try {
      await authApi.updateProfile({
        displayName: displayNameInput.trim() || null,
        slug: null,
        enabled: user.profile?.published ?? false,
      });
      setUser({ ...user, displayName: displayNameInput.trim() || null });
      setSaveMsg("Saved.");
    } catch (e) {
      setSaveMsg(e instanceof ApiError ? e.message : "Could not save.");
    } finally {
      setSavePending(false);
    }
  }

  async function onMakePublic() {
    if (!user) return;
    try {
      const updated = await authApi.updateProfile({
        displayName: user.displayName ?? null,
        slug: user.profile?.slug ?? null,
        enabled: true,
      });
      setUser({
        ...user,
        profile: user.profile ? { ...user.profile, published: updated.published } : user.profile,
      });
    } catch {
      /* ignore — button remains */
    }
  }

  function openSettings() {
    setSettingsOpen(true);
    setSettingsActive(true);
    window.location.hash = "profile-settings";
    document.getElementById("profile-settings")?.scrollIntoView({ behavior: "smooth" });
  }

  if (error === "auth") {
    return (
      <div className="lp-profile-htb">
        <main className="lp-profile-htb-main">
          <p className="lp-profile-htb-handle">
            <Link href={`${routes.login}?next=${encodeURIComponent(routes.account)}`}>Sign in</Link> to
            view your profile.
          </p>
        </main>
      </div>
    );
  }

  if (error === "load" || !user || !progress) {
    if (error) {
      return (
        <div className="lp-profile-htb">
          <main className="lp-profile-htb-main">
            <p className="lp-profile-htb-handle">Could not load profile. Refresh to try again.</p>
          </main>
        </div>
      );
    }
    return <GlobalLoader />;
  }

  const shownName = displayName(user);
  const handle = handleFromUser(user);
  const streak = progress.streak.current;
  const publicUrl =
    user.profile?.published && user.profile.urlPath
      ? routes.profile(user.profile.slug ?? "")
      : null;

  return (
    <div className="lp-profile-htb lp-dash-figma--htb">
      <DashboardHtbNav user={user} />

      <main className="lp-profile-htb-main">
        <header className="lp-profile-htb-head">
          <div className="lp-profile-htb-logo" aria-hidden>
            {initialsForUser(user, shownName).slice(0, 1)}
          </div>
          <div className="lp-profile-htb-identity">
            <h1 className="lp-profile-htb-name">{shownName}</h1>
            <p className="lp-profile-htb-handle">{handle}</p>
            <p className="lp-profile-htb-location">
              <MapPin size={16} strokeWidth={2} aria-hidden />
              LabPath learner
            </p>
          </div>
          <div className="lp-profile-htb-head-actions">
            <button type="button" className="lp-profile-htb-btn" onClick={openSettings}>
              Edit
            </button>
            {!user.profile?.published ? (
              <button type="button" className="lp-profile-htb-btn lp-profile-htb-btn--primary" onClick={onMakePublic}>
                Make your profile public
              </button>
            ) : publicUrl ? (
              <Link href={publicUrl} className="lp-profile-htb-btn lp-profile-htb-btn--primary">
                View public profile
                <ExternalLink size={16} aria-hidden />
              </Link>
            ) : null}
            <button type="button" className="lp-profile-htb-btn lp-profile-htb-btn--icon" aria-label="More options">
              <MoreHorizontal size={18} aria-hidden />
            </button>
          </div>
        </header>

        <div className="lp-profile-htb-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "about"}
            className={`lp-profile-htb-tab${tab === "about" ? " is-active" : ""}`}
            onClick={() => setTab("about")}
          >
            About
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "badges"}
            className={`lp-profile-htb-tab${tab === "badges" ? " is-active" : ""}`}
            onClick={() => setTab("badges")}
          >
            Badges
          </button>
        </div>

        {tab === "about" ? (
          <div className="lp-profile-htb-grid">
            <div className="lp-profile-htb-col">
              <EmptyPanel
                message="Add a short summary to tell the community about yourself."
                cta="Add summary"
                onClick={openSettings}
              />

              <section className="lp-profile-htb-rank" aria-label="Rank">
                <div className="lp-profile-htb-rank-top">
                  <div>
                    <p className="lp-profile-htb-rank-title">{rankTitle}</p>
                    <p className="lp-profile-htb-rank-meta">LabPath rank · {progress.solves} solves</p>
                  </div>
                  <span className="lp-profile-htb-level">Lvl {level.level}</span>
                </div>
                <div className="lp-profile-htb-progress">
                  <div className="lp-profile-htb-progress-bar">
                    <div
                      className="lp-profile-htb-progress-fill"
                      style={{ width: `${level.pct}%` }}
                    />
                  </div>
                  <p className="lp-profile-htb-progress-label">
                    {level.current}/{level.next} XP to next level
                  </p>
                </div>
              </section>

              <section className="lp-profile-htb-card" aria-label="Activity">
                <div className="lp-profile-htb-heatmap-head">
                  <h2 className="lp-profile-htb-heatmap-title">
                    {heatTotal} submissions in the last year
                  </h2>
                  <span className="lp-profile-htb-heatmap-range">
                    {heatmapDays[0]?.date.slice(0, 7)} – {todayKey.slice(0, 7)}
                  </span>
                </div>
                <div className="lp-dash-figma-heatmap-scroll">
                  <div
                    className="lp-dash-figma-heatmap-grid"
                    style={{ gridTemplateColumns: `repeat(${heatmapWeeks.length}, 12px)` }}
                  >
                    {heatmapWeeks.flatMap((week, wi) =>
                      week.map((day, di) => {
                        const levelNum = heatLevel(day.count);
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
                              levelNum ? ` lp-dash-figma-heatmap-cell--l${levelNum}` : ""
                            }${isToday ? " lp-dash-figma-heatmap-cell--today" : ""}`}
                            initial={reduceMotion ? undefined : { opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                              delay: reduceMotion ? 0 : (wi + di) * 0.004,
                              duration: 0.2,
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
                <div className="lp-profile-htb-stats-row">
                  <div className="lp-profile-htb-stat-box">
                    <p className="lp-profile-htb-stat-label">Weekly average</p>
                    <p className="lp-profile-htb-stat-val">{weeklyAvg}</p>
                  </div>
                  <div className="lp-profile-htb-stat-box">
                    <p className="lp-profile-htb-stat-label">Total XP</p>
                    <p className="lp-profile-htb-stat-val">{xpTotal.toLocaleString()}</p>
                  </div>
                  <div className="lp-profile-htb-stat-box">
                    <p className="lp-profile-htb-stat-label">Weeks active</p>
                    <p className="lp-profile-htb-stat-val">
                      {Math.max(1, Math.ceil(activeDays(heatmapDays) / 7))}
                    </p>
                  </div>
                </div>
              </section>

              <section aria-labelledby="profile-certs-title">
                <h2 id="profile-certs-title" className="lp-profile-htb-section-title">
                  Certifications
                </h2>
                <EmptyPanel
                  message="Complete LabPath paths to earn shareable certificates."
                  cta="Explore problems"
                  href={routes.problems}
                />
              </section>

              <section aria-labelledby="profile-ach-title">
                <h2 id="profile-ach-title" className="lp-profile-htb-section-title">
                  Achievements
                </h2>
                <EmptyPanel
                  message="Solve problems and keep your streak to unlock achievements."
                  cta="Go to dashboard"
                  href={routes.dashboard}
                />
              </section>
            </div>

            <div className="lp-profile-htb-col">
              <section className="lp-profile-htb-card">
                <h2 className="lp-profile-htb-widget-title">Socials</h2>
                <EmptyPanel message="Connect your social accounts." cta="Add socials" onClick={openSettings} />
              </section>

              <section className="lp-profile-htb-card">
                <h2 className="lp-profile-htb-widget-title">Practice streak</h2>
                <div className="lp-profile-htb-streak">
                  <Flame size={28} className="text-[#9FEF00]" strokeWidth={2} aria-hidden />
                  <span className="lp-profile-htb-streak-val">
                    {streak} day{streak === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="lp-profile-htb-streak-days" aria-hidden>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <span
                      key={i}
                      className={`lp-profile-htb-streak-day${i < Math.min(streak, 7) ? " is-done" : ""}`}
                    />
                  ))}
                </div>
              </section>

              <section className="lp-profile-htb-card">
                <h2 className="lp-profile-htb-widget-title">Top interests</h2>
                <EmptyPanel message="Show what you are learning." cta="Add interests" onClick={openSettings} />
              </section>

              <section className="lp-profile-htb-card">
                <h2 className="lp-profile-htb-widget-title">Badges</h2>
                <p className="lp-profile-htb-handle" style={{ margin: 0, lineHeight: 1.5 }}>
                  Badges are earned by completing labs, streaks, and special events.
                </p>
              </section>

              <section className="lp-profile-htb-card">
                <h2 className="lp-profile-htb-widget-title">Skills</h2>
                {progress.skills.length > 0 ? (
                  <div>
                    {progress.skills.slice(0, 6).map((skill) => (
                      <div key={skill.slug} className="lp-profile-htb-skill">
                        <span>{skill.name}</span>
                        <strong>{Math.round(skill.score)}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyPanel message="Practice problems to build your skill graph." cta="Add skills" href={routes.problems} />
                )}
              </section>

              <section className="lp-profile-htb-card">
                <h2 className="lp-profile-htb-widget-title">Toolstack</h2>
                <EmptyPanel message="List tools you use in the lab." cta="Add tools" onClick={openSettings} />
              </section>
            </div>
          </div>
        ) : (
          <section className="lp-profile-htb-card" aria-label="Badges">
            <div className="lp-profile-htb-empty" style={{ minHeight: 200 }}>
              <Sparkles size={32} className="text-[#9FEF00]" aria-hidden />
              <p>Your badges will appear here as you earn them on LabPath.</p>
              <Link href={routes.dashboard} className="lp-profile-htb-link">
                View activity on dashboard
              </Link>
            </div>
          </section>
        )}

        {settingsOpen ? (
          <section
            id="profile-settings"
            className="lp-profile-htb-card lp-profile-htb-settings"
            aria-label="Profile settings"
            style={{ marginTop: 28 }}
          >
            <h2 className="lp-profile-htb-section-title">Settings</h2>
            <form className="lp-profile-htb-form" onSubmit={onSaveProfile}>
              <div className="lp-profile-htb-field">
                <label htmlFor="profile-display-name">Display name</label>
                <input
                  id="profile-display-name"
                  className="lp-profile-htb-input"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  maxLength={40}
                  autoComplete="nickname"
                />
              </div>
              <div className="lp-profile-htb-field">
                <label htmlFor="profile-email">Email</label>
                <input
                  id="profile-email"
                  className="lp-profile-htb-input"
                  value={user.email}
                  readOnly
                  disabled
                />
              </div>
              {saveMsg ? (
                <p className={saveMsg === "Saved." ? "lp-profile-htb-msg-ok" : "lp-profile-htb-msg-err"}>
                  {saveMsg}
                </p>
              ) : null}
              <button type="submit" className="lp-profile-htb-btn lp-profile-htb-btn--primary" disabled={savePending}>
                {savePending ? "Saving…" : "Save profile"}
              </button>
            </form>
          </section>
        ) : null}
      </main>
    </div>
  );
}
