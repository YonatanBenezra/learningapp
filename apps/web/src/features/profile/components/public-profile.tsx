"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GlobalLoader } from "@/components/ui/global-loader";
import { routes } from "@/config/routes";
import { profileApi } from "@/features/profile/profile-api";
import { skillBarWidths, skillStaleNote } from "@/features/progress/skill-freshness";
import { ApiError } from "@/lib/api-client";
import type { PublicProfile } from "@/types/profile";
import "../public-profile.css";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

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

export function PublicProfileView({ slug }: { slug: string }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<"missing" | "load" | null>(null);

  useEffect(() => {
    let cancelled = false;
    profileApi
      .getPublic(slug)
      .then((result) => {
        if (!cancelled) {
          setProfile(result);
        }
      })
      .catch((caught: unknown) => {
        if (cancelled) {
          return;
        }
        setError(
          caught instanceof ApiError && caught.status === 404
            ? "missing"
            : "load",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (error === "missing") {
    return (
      <div className="lp-page lp-page-catalogue lp-page-profile">
        <div className="lp-pp">
          <header className="lp-pp-hero">
            <div className="lp-pp-identity">
              <span className="lp-pp-avatar" aria-hidden="true">
                ?
              </span>
              <div className="lp-pp-copy">
                <p className="lp-pp-kicker">Public profile</p>
                <h1 className="lp-pp-title">Profile unavailable</h1>
                <p className="lp-pp-lead">
                  This profile is private or does not exist.
                </p>
              </div>
            </div>
          </header>
        </div>
      </div>
    );
  }

  if (error === "load") {
    return (
      <div className="lp-page lp-page-catalogue lp-page-profile">
        <div className="lp-pp">
          <div className="lp-pp-error">
            <strong>Could not load this profile</strong>
            <p>Check that the API is running, then refresh this page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <GlobalLoader fullPage />;
  }

  const scoredSkills = profile.skills.filter((skill) => skill.score > 0).length;

  return (
    <div className="lp-page lp-page-catalogue lp-page-profile">
      <div className="lp-pp">
        <header className="lp-pp-hero">
          <div className="lp-pp-identity">
            <span className="lp-pp-avatar" aria-hidden="true">
              {initials(profile.displayName)}
            </span>
            <div className="lp-pp-copy">
              <p className="lp-pp-kicker">Public profile</p>
              <h1 className="lp-pp-title">{profile.displayName}</h1>
              <p className="lp-pp-lead">
                Verified solves and a skill snapshot. No traces or hidden evals.
              </p>
            </div>
          </div>
          <div className="lp-pp-meta">
            <span className="lp-pp-chip lp-pp-chip--brand">/{profile.slug}</span>
            <span className="lp-pp-chip">{profile.solves} solves</span>
          </div>
        </header>

        <section className="lp-pp-stats" aria-label="Profile stats">
          <div className="lp-pp-stat">
            <span className="lp-pp-stat-value">{profile.solves}</span>
            <span className="lp-pp-stat-label">
              verified solve{profile.solves === 1 ? "" : "s"}
            </span>
          </div>
          <div className="lp-pp-stat lp-pp-stat--rating">
            <span className="lp-pp-stat-value">{profile.rating}</span>
            <span className="lp-pp-stat-label">rating</span>
          </div>
          <div className="lp-pp-stat">
            <span className="lp-pp-stat-value">{scoredSkills}</span>
            <span className="lp-pp-stat-label">skills scored</span>
          </div>
          <div className="lp-pp-stat">
            <span className="lp-pp-stat-value">{profile.recent.length}</span>
            <span className="lp-pp-stat-label">recent shown</span>
          </div>
        </section>

        <div className="lp-pp-layout">
          <section className="lp-pp-panel" aria-label="Skills">
            <div className="lp-pp-panel-head">
              <div>
                <p className="lp-pp-panel-kicker">Competency</p>
                <h2 className="lp-pp-panel-title">Skill radar</h2>
              </div>
              <p className="lp-pp-panel-note">
                {profile.skills.length} skill
                {profile.skills.length === 1 ? "" : "s"}
              </p>
            </div>

            {profile.skills.length === 0 ? (
              <p className="lp-pp-empty">No public skill scores yet.</p>
            ) : (
              <div className="lp-pp-skills">
                {profile.skills.map((skill) => {
                  const blank = skill.score <= 0;
                  const note = skillStaleNote(skill);
                  const bar = skillBarWidths(skill);
                  return (
                    <div key={skill.slug} className="lp-pp-skill">
                      <div className="lp-pp-skill-top">
                        <p className="lp-pp-skill-name">{skill.name}</p>
                        <span
                          className={`lp-pp-skill-score${blank ? " is-empty" : ""}`}
                        >
                          {blank ? "—" : skill.score.toFixed(2)}
                        </span>
                      </div>
                      <div className="lp-pp-bar" aria-hidden="true">
                        <span className="lp-pp-bar-raw" style={{ width: `${bar.raw}%` }}>
                          <span
                            className="lp-pp-bar-fill"
                            style={{ width: `${bar.fill}%` }}
                          />
                        </span>
                      </div>
                      {note ? <p className="lp-pp-skill-stale">{note}</p> : null}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="lp-pp-panel" aria-label="Verified solves">
            <div className="lp-pp-panel-head">
              <div>
                <p className="lp-pp-panel-kicker">Recent</p>
                <h2 className="lp-pp-panel-title">Verified solves</h2>
              </div>
            </div>

            {profile.recent.length === 0 ? (
              <p className="lp-pp-empty">No public solves yet.</p>
            ) : (
              <ul className="lp-pp-solves">
                {profile.recent.map((item) => (
                  <li key={item.slug}>
                    <Link href={routes.exercise(item.slug)} className="lp-pp-solve">
                      <p className="lp-pp-solve-title">{item.title}</p>
                      <span className="lp-pp-solve-date">
                        {formatWhen(item.passedAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
