"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { GlobalLoader } from "@/components/ui/global-loader";
import { routes } from "@/config/routes";
import { authApi } from "@/features/auth/auth-api";
import { LogoutButton } from "@/features/auth/logout-button";
import { problemsApi } from "@/features/problems/problems-api";
import { progressApi } from "@/features/progress/progress-api";
import {
  activeDays,
  attemptingCount,
  buildHeatmap,
  difficultyBreakdown,
  groupSkills,
  languageUsage,
  maxStreakFromHeatmap,
  passedSlugs,
  totalSubmissions,
} from "@/features/progress/progress-stats";
import { ApiError } from "@/lib/api-client";
import type { Exercise } from "@/types/exercise";
import type { Progress, ProgressItem } from "@/types/progress";
import type { User } from "@/types/user";
import "../progress-lc.css";

type TabId = "recent" | "list" | "skills";

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function userInitial(user: User) {
  const source = user.displayName?.trim() || user.email;
  return source.charAt(0).toUpperCase();
}

function displayName(user: User) {
  return user.displayName?.trim() || user.email.split("@")[0] || "Learner";
}

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
  if (count <= 4) {
    return 3;
  }
  return 4;
}

function SolvedRing({
  solved,
  total,
  attempting,
}: {
  solved: number;
  total: number;
  attempting: number;
}) {
  const pct = total > 0 ? Math.min(100, (solved / total) * 100) : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="lp-lc-ring-wrap">
      <svg viewBox="0 0 120 120" className="lp-lc-ring" aria-hidden="true">
        <circle cx="60" cy="60" r={radius} className="lp-lc-ring-bg" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          className="lp-lc-ring-fill"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="lp-lc-ring-center">
        <strong>
          {solved}/{total}
        </strong>
        <span>Solved</span>
        <span>{attempting} Attempting</span>
      </div>
    </div>
  );
}

function DifficultyRow({
  label,
  className,
  barClass,
  solved,
  total,
}: {
  label: string;
  className: string;
  barClass: string;
  solved: number;
  total: number;
}) {
  const pct = total > 0 ? (solved / total) * 100 : 0;
  return (
    <div className="lp-lc-diff-row">
      <span className={`lp-lc-diff-label ${className}`}>{label}</span>
      <div className="lp-lc-diff-bar">
        <span className={barClass} style={{ width: `${pct}%` }} />
      </div>
      <span className="lp-lc-diff-count">
        {solved}/{total}
      </span>
    </div>
  );
}

function ProfileEditForm({
  user,
  onCancel,
  onSaved,
}: {
  user: User;
  onCancel: () => void;
  onSaved: (displayName: string | null) => void;
}) {
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await authApi.updateProfile({
        displayName: displayName.trim() || null,
        slug: null,
        enabled: false,
      });
      onSaved(displayName.trim() || null);
    } catch (caught: unknown) {
      setError(
        caught instanceof ApiError ? caught.message : "Could not save profile.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="lp-lc-profile-edit" onSubmit={onSubmit}>
      <label className="lp-lc-profile-edit-field">
        <span>Display name</span>
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          maxLength={40}
          autoComplete="nickname"
          placeholder="Your name"
        />
      </label>
      <p className="lp-lc-profile-edit-email">{user.email}</p>
      {error ? <p className="lp-lc-profile-edit-error">{error}</p> : null}
      <div className="lp-lc-profile-edit-actions">
        <button type="submit" className="lp-lc-edit-btn" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </button>
        <button type="button" className="lp-lc-edit-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function SubmissionRow({ item }: { item: ProgressItem }) {
  const passed = item.verdict?.toLowerCase() === "pass";
  return (
    <li className="lp-lc-sub-item">
      <div>
        <Link href={routes.exercise(item.exerciseSlug)}>{item.title}</Link>
        <p className="lp-lc-sub-meta">
          {item.startedAt ? formatWhen(item.startedAt) : "—"} · {item.status}
        </p>
      </div>
      <span className={`lp-lc-pill${passed ? " lp-lc-pill--pass" : item.verdict ? " lp-lc-pill--fail" : ""}`}>
        {item.verdict ?? item.status}
      </span>
    </li>
  );
}

export function ProgressView() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [problems, setProblems] = useState<Exercise[]>([]);
  const [error, setError] = useState<"auth" | "load" | null>(null);
  const [tab, setTab] = useState<TabId>("recent");
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([progressApi.getMine(), authApi.me(), problemsApi.list()])
      .then(([mine, me, catalogue]) => {
        if (!cancelled) {
          setProgress(mine);
          setUser(me);
          setProblems(catalogue.items);
        }
      })
      .catch((caught: unknown) => {
        if (cancelled) {
          return;
        }
        setError(
          caught instanceof ApiError && caught.status === 401 ? "auth" : "load",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const solvedSet = useMemo(
    () => (progress ? passedSlugs(progress.items) : new Set<string>()),
    [progress],
  );

  const breakdown = useMemo(
    () => difficultyBreakdown(problems, solvedSet),
    [problems, solvedSet],
  );

  const heatmap = useMemo(
    () => (progress ? buildHeatmap(progress.items) : []),
    [progress],
  );

  const skillGroups = useMemo(
    () => (progress ? groupSkills(progress.skills) : null),
    [progress],
  );

  const languages = useMemo(
    () => (progress ? languageUsage(progress.items, problems) : []),
    [progress, problems],
  );

  const recentPassed = useMemo(
    () =>
      progress?.items.filter((item) => item.verdict?.toLowerCase() === "pass") ??
      [],
    [progress],
  );

  if (error === "auth") {
    return (
      <div className="lp-lc-profile">
        <div className="lp-lc-empty">
          Sign in to view your dashboard.{" "}
          <Link href={`${routes.login}?next=${encodeURIComponent(routes.progress)}`}>
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (error === "load") {
    return (
      <div className="lp-lc-profile">
        <div className="lp-lc-empty">Could not load dashboard. Refresh to try again.</div>
      </div>
    );
  }

  if (!progress || !user) {
    return <GlobalLoader contained />;
  }

  const totalProblems = problems.length;
  const solvedCount = solvedSet.size;
  const attempting = attemptingCount(progress.items, solvedSet);
  const submissionsYear = totalSubmissions(heatmap);
  const activeDayCount = activeDays(heatmap);
  const heatStreak = maxStreakFromHeatmap(heatmap);
  const drill = progress.dailyDrill;

  return (
    <div className="lp-lc-profile">
      <div className="lp-lc-grid">
        <aside className="lp-lc-side">
          <section className="lp-lc-card lp-lc-profile-card">
            <div className="lp-lc-avatar">{userInitial(user)}</div>
            <h1 className="lp-lc-username">{displayName(user)}</h1>
            <p className="lp-lc-rank">Rank ~{Math.max(1, 500000 - progress.solves * 120)}</p>
            <div className="lp-lc-profile-meta">
              <span>
                <strong>{progress.solves}</strong> Solved
              </span>
              <span>
                <strong>{progress.streak.current}</strong> Streak
              </span>
            </div>
            {editingProfile ? (
              <ProfileEditForm
                user={user}
                onCancel={() => setEditingProfile(false)}
                onSaved={(nextName) => {
                  setUser((current) =>
                    current ? { ...current, displayName: nextName } : current,
                  );
                  setEditingProfile(false);
                }}
              />
            ) : (
              <button
                type="button"
                className="lp-lc-edit-btn"
                onClick={() => setEditingProfile(true)}
              >
                Edit Profile
              </button>
            )}
          </section>

          <section className="lp-lc-card lp-lc-stats-card">
            <h2 className="lp-lc-stats-title">Community Stats</h2>
            <div className="lp-lc-stat-row">
              <div className="lp-lc-stat-left">
                <span className="lp-lc-stat-icon lp-lc-stat-icon--blue" aria-hidden="true">
                  <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
                    <path d="M1.5 8s2.5-4 6.5-4 6.5 4 6.5 4-2.5 4-6.5 4-6.5-4-6.5-4Z" stroke="currentColor" strokeWidth="1.3" />
                    <circle cx="8" cy="8" r="1.8" fill="currentColor" />
                  </svg>
                </span>
                <span className="lp-lc-stat-label">Views</span>
              </div>
              <div className="lp-lc-stat-value">
                {progress.attempts}
                <span className="lp-lc-stat-sub">Attempts</span>
              </div>
            </div>
            <div className="lp-lc-stat-row">
              <div className="lp-lc-stat-left">
                <span className="lp-lc-stat-icon lp-lc-stat-icon--teal" aria-hidden="true">
                  <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
                    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="lp-lc-stat-label">Solution</span>
              </div>
              <div className="lp-lc-stat-value">
                {progress.solves}
                <span className="lp-lc-stat-sub">Accepted</span>
              </div>
            </div>
            <div className="lp-lc-stat-row">
              <div className="lp-lc-stat-left">
                <span className="lp-lc-stat-icon lp-lc-stat-icon--amber" aria-hidden="true">
                  <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
                    <path d="M3 4h10v8H3z" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M5.5 7h5M5.5 9.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="lp-lc-stat-label">Discuss</span>
              </div>
              <div className="lp-lc-stat-value">
                {progress.streak.current}
                <span className="lp-lc-stat-sub">Day streak</span>
              </div>
            </div>
            <div className="lp-lc-stat-row">
              <div className="lp-lc-stat-left">
                <span className="lp-lc-stat-icon lp-lc-stat-icon--violet" aria-hidden="true">
                  <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
                    <path d="M8 2.5 9.6 6.2 13.5 6.6 10.5 9.2 11.4 13 8 11.1 4.6 13 5.5 9.2 2.5 6.6 6.4 6.2 8 2.5Z" fill="currentColor" />
                  </svg>
                </span>
                <span className="lp-lc-stat-label">Reputation</span>
              </div>
              <div className="lp-lc-stat-value">
                {progress.skills.filter((s) => s.score > 0).length}
                <span className="lp-lc-stat-sub">Skills scored</span>
              </div>
            </div>
          </section>

          <section className="lp-lc-card lp-lc-lang-card">
            <h2 className="lp-lc-lang-title">Languages</h2>
            {languages.length === 0 ? (
              <p className="lp-lc-lang-empty">Not enough data</p>
            ) : (
              <ul className="lp-lc-lang-list">
                {languages.map((entry) => {
                  const max = languages[0]?.count ?? 1;
                  const pct = Math.round((entry.count / max) * 100);
                  return (
                    <li key={entry.slug} className="lp-lc-lang-row">
                      <span className="lp-lc-lang-label">{entry.label}</span>
                      <div className="lp-lc-lang-bar">
                        <span style={{ width: `${pct}%` }} />
                      </div>
                      <span className="lp-lc-lang-count">{entry.count}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {skillGroups ? (
            <section className="lp-lc-card lp-lc-skills-card">
              <h2 className="lp-lc-skills-title">Skills</h2>
              {skillGroups.advanced.length > 0 ? (
                <div className="lp-lc-skill-group">
                  <div className="lp-lc-skill-group-head">
                    <span className="lp-lc-skill-dot lp-lc-skill-dot--adv" />
                    Advanced
                  </div>
                  <div className="lp-lc-skill-tags">
                    {skillGroups.advanced.map((s) => (
                      <span key={s.slug} className="lp-lc-skill-tag">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {skillGroups.intermediate.length > 0 ? (
                <div className="lp-lc-skill-group">
                  <div className="lp-lc-skill-group-head">
                    <span className="lp-lc-skill-dot lp-lc-skill-dot--mid" />
                    Intermediate
                  </div>
                  <div className="lp-lc-skill-tags">
                    {skillGroups.intermediate.map((s) => (
                      <span key={s.slug} className="lp-lc-skill-tag">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {skillGroups.fundamental.length > 0 ? (
                <div className="lp-lc-skill-group">
                  <div className="lp-lc-skill-group-head">
                    <span className="lp-lc-skill-dot lp-lc-skill-dot--fund" />
                    Fundamental
                  </div>
                  <div className="lp-lc-skill-tags">
                    {skillGroups.fundamental.map((s) => (
                      <span key={s.slug} className="lp-lc-skill-tag">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {progress.skills.length === 0 ? (
                <p className="lp-lc-sub-meta">No skill scores yet.</p>
              ) : null}
            </section>
          ) : null}

          <LogoutButton className="lp-lc-logout-btn" />
        </aside>

        <div className="lp-lc-main">
          <div className="lp-lc-top-row">
            <section className="lp-lc-card lp-lc-solved-card">
              <SolvedRing
                solved={solvedCount}
                total={totalProblems}
                attempting={attempting}
              />
              <div className="lp-lc-diff-grid">
                <DifficultyRow
                  label="Easy"
                  className="lp-lc-diff-label--easy"
                  barClass="lp-lc-diff-bar--easy"
                  solved={breakdown.easy.solved}
                  total={breakdown.easy.total}
                />
                <DifficultyRow
                  label="Med."
                  className="lp-lc-diff-label--med"
                  barClass="lp-lc-diff-bar--med"
                  solved={breakdown.medium.solved}
                  total={breakdown.medium.total}
                />
                <DifficultyRow
                  label="Hard"
                  className="lp-lc-diff-label--hard"
                  barClass="lp-lc-diff-bar--hard"
                  solved={breakdown.hard.solved}
                  total={breakdown.hard.total}
                />
              </div>
            </section>

            <section className="lp-lc-card lp-lc-badge-card">
              <div className="lp-lc-badge-head">
                <h2 className="lp-lc-badge-title">Badges</h2>
                <span className="lp-lc-badge-count">{drill?.completed ? 1 : 0}</span>
              </div>
              <div className="lp-lc-badge-locked">
                <span className="lp-lc-badge-icon" aria-hidden="true">
                  🏅
                </span>
                <div className="lp-lc-badge-copy">
                  <strong>{drill ? "Daily Drill" : "No drill today"}</strong>
                  <span>
                    {drill
                      ? drill.completed
                        ? `${drill.title} · completed`
                        : `${drill.title} · open today's exercise`
                      : "Check back tomorrow for a new challenge"}
                  </span>
                </div>
              </div>
              {drill && !drill.completed ? (
                <Link
                  href={routes.exercise(drill.slug)}
                  className="lp-lc-edit-btn"
                  style={{ marginTop: "0.75rem" }}
                >
                  Start daily drill
                </Link>
              ) : null}
            </section>
          </div>

          <section className="lp-lc-card lp-lc-heat-card">
            <div className="lp-lc-heat-head">
              <h2 className="lp-lc-heat-title">
                {submissionsYear} submissions in the past one year
              </h2>
              <div className="lp-lc-heat-meta">
                <span>
                  Total active days: <strong>{activeDayCount}</strong>
                </span>
                <span>
                  Max streak: <strong>{Math.max(heatStreak, progress.streak.longest)}</strong>
                </span>
              </div>
            </div>
            <div className="lp-lc-heat-grid" aria-label="Submission activity">
              {heatmap.map((day) => (
                <span
                  key={day.date}
                  className="lp-lc-heat-cell"
                  data-level={heatLevel(day.count)}
                  title={`${day.date}: ${day.count} submission${day.count === 1 ? "" : "s"}`}
                />
              ))}
            </div>
          </section>

          <section className="lp-lc-card lp-lc-tabs-card">
            <div className="lp-lc-tabs-head">
              <nav className="lp-lc-tabs" aria-label="Submission views">
                <button
                  type="button"
                  className={`lp-lc-tab${tab === "recent" ? " is-active" : ""}`}
                  onClick={() => setTab("recent")}
                >
                  <span className="lp-lc-tab-icon lp-lc-tab-icon--ac">✓</span>
                  Recent AC
                </button>
                <button
                  type="button"
                  className={`lp-lc-tab${tab === "list" ? " is-active" : ""}`}
                  onClick={() => setTab("list")}
                >
                  <span className="lp-lc-tab-icon lp-lc-tab-icon--list">≡</span>
                  List
                </button>
                <button
                  type="button"
                  className={`lp-lc-tab${tab === "skills" ? " is-active" : ""}`}
                  onClick={() => setTab("skills")}
                >
                  <span className="lp-lc-tab-icon lp-lc-tab-icon--skills">★</span>
                  Skills
                </button>
              </nav>
              <Link href={routes.problems} className="lp-lc-view-all">
                View all problems →
              </Link>
            </div>

            <div className="lp-lc-tab-body">
              {tab === "recent" ? (
                recentPassed.length === 0 ? (
                  <div className="lp-lc-empty lp-lc-empty--submissions">
                    <Image
                      src="/illustrations/null-empty.png"
                      alt=""
                      width={140}
                      height={88}
                      className="lp-lc-empty-art"
                      priority={false}
                    />
                    <p>No recent submissions</p>
                  </div>
                ) : (
                  <ul className="lp-lc-sub-list">
                    {recentPassed.slice(0, 12).map((item) => (
                      <SubmissionRow key={item.attemptId} item={item} />
                    ))}
                  </ul>
                )
              ) : null}

              {tab === "list" ? (
                progress.items.length === 0 ? (
                  <div className="lp-lc-empty">No submissions yet. Start a problem!</div>
                ) : (
                  <ul className="lp-lc-sub-list">
                    {progress.items.slice(0, 20).map((item) => (
                      <SubmissionRow key={item.attemptId} item={item} />
                    ))}
                  </ul>
                )
              ) : null}

              {tab === "skills" ? (
                progress.skills.length === 0 ? (
                  <div className="lp-lc-empty">No skill scores yet.</div>
                ) : (
                  <ul className="lp-lc-sub-list">
                    {progress.skills.map((skill) => (
                      <li key={skill.slug} className="lp-lc-sub-item">
                        <div>
                          <strong>{skill.name}</strong>
                          <p className="lp-lc-sub-meta">
                            {skill.stale
                              ? `Last practiced ${skill.daysSincePractice ?? "—"} days ago`
                              : "Recently practiced"}
                          </p>
                        </div>
                        <span className="lp-lc-stat-value">
                          {skill.score > 0 ? skill.score.toFixed(2) : "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
