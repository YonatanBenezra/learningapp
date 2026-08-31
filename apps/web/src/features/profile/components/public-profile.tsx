"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { profileApi } from "@/features/profile/profile-api";
import { SkillsTable } from "@/features/progress/components/skills-table";
import { ApiError } from "@/lib/api-client";
import type { PublicProfile } from "@/types/profile";

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
      <div className="lp-page lp-page-progress">
        <header className="lp-cat-header">
          <h1 className="lp-cat-title">Profile unavailable</h1>
          <p className="lp-cat-lead">
            This profile is private or does not exist.
          </p>
        </header>
      </div>
    );
  }

  if (error === "load") {
    return <p className="lp-page lp-pg-note">Could not load this profile.</p>;
  }

  if (!profile) {
    return <p className="lp-page lp-pg-note">Loading profile…</p>;
  }

  return (
    <div className="lp-page lp-page-progress">
      <header className="lp-cat-header">
        <p className="lp-panel-eyebrow">Public profile</p>
        <h1 className="lp-cat-title">{profile.displayName}</h1>
        <p className="lp-cat-lead">
          Verified solves and a skill snapshot. No traces or hidden evals.
        </p>
      </header>
      <div className="lp-pg">
        <section className="lp-panel lp-pg-panel">
          <div className="lp-pg-stats">
            <div className="lp-pg-stat">
              <span className="lp-pg-stat-value">{profile.solves}</span>
              <span className="lp-pg-stat-label">
                verified solve{profile.solves === 1 ? "" : "s"}
              </span>
            </div>
            <div className="lp-pg-stat">
              <span className="lp-pg-stat-value">{profile.rating}</span>
              <span className="lp-pg-stat-label">rating</span>
            </div>
            <div className="lp-pg-stat">
              <span className="lp-pg-stat-value">
                {profile.skills.filter((skill) => skill.score > 0).length}
              </span>
              <span className="lp-pg-stat-label">skills scored</span>
            </div>
            <div className="lp-pg-stat">
              <span className="lp-pg-stat-value">/{profile.slug}</span>
              <span className="lp-pg-stat-label">profile URL</span>
            </div>
          </div>
        </section>
        <section className="lp-panel lp-pg-panel">
          <div className="lp-pg-panel-top">
            <p className="lp-panel-eyebrow">Competency</p>
            <h2 className="lp-panel-title">Skill radar</h2>
          </div>
          <SkillsTable skills={profile.skills} empty="No public skill scores yet." />
        </section>
        <section className="lp-panel lp-pg-panel">
          <div className="lp-pg-panel-top">
            <p className="lp-panel-eyebrow">Recent</p>
            <h2 className="lp-panel-title">Verified solves</h2>
          </div>
          {profile.recent.length === 0 ? (
            <p className="lp-pg-empty">No public solves yet.</p>
          ) : (
            <ul className="lp-pg-solves">
              {profile.recent.map((item) => (
                <li key={item.slug}>
                  <Link href={routes.exercise(item.slug)} className="lp-pg-table-exercise">
                    {item.title}
                  </Link>
                  <span className="lp-pg-table-date">{formatWhen(item.passedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
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
