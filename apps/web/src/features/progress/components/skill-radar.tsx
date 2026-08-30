"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { progressApi } from "@/features/progress/progress-api";
import { ApiError } from "@/lib/api-client";
import type { Progress, SkillScore } from "@/types/progress";

export function SkillRadar() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<"auth" | "load" | null>(null);

  useEffect(() => {
    let cancelled = false;
    progressApi
      .getMine()
      .then((result) => {
        if (!cancelled) {
          setProgress(result);
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

  return (
    <section className="lp-panel lp-pg-panel">
      <div className="lp-pg-panel-top">
        <div>
          <p className="lp-panel-eyebrow">Competency</p>
          <h2 className="lp-panel-title">Skill scores</h2>
        </div>
      </div>
      {progress ? (
        <div className="lp-pg-stats">
          <div className="lp-pg-stat">
            <span className="lp-pg-stat-value">{progress.solves}</span>
            <span className="lp-pg-stat-label">
              solve{progress.solves === 1 ? "" : "s"}
            </span>
          </div>
          <div className="lp-pg-stat">
            <span className="lp-pg-stat-value">{progress.attempts}</span>
            <span className="lp-pg-stat-label">
              attempt{progress.attempts === 1 ? "" : "s"}
            </span>
          </div>
          <div className="lp-pg-stat">
            <span className="lp-pg-stat-value">
              {progress.skills.filter((skill) => skill.score > 0).length}
            </span>
            <span className="lp-pg-stat-label">skills scored</span>
          </div>
        </div>
      ) : null}
      {error === "auth" ? (
        <p className="lp-pg-note">
          Sign in to view progress.{" "}
          <Link
            href={`${routes.login}?next=${encodeURIComponent(routes.progress)}`}
            className="lp-link"
          >
            Sign in
          </Link>
        </p>
      ) : null}
      {error === "load" ? (
        <p className="lp-pg-note">Could not load skills.</p>
      ) : null}
      {!error && !progress ? (
        <div className="lp-pg-skel" aria-hidden="true">
          <span className="lp-skel-line" />
          <span className="lp-skel-line" />
          <span className="lp-skel-line" />
        </div>
      ) : null}
      {progress ? <ScoredSkills skills={progress.skills} /> : null}
    </section>
  );
}

function ScoredSkills({ skills }: { skills: SkillScore[] }) {
  if (skills.length === 0) {
    return <p className="lp-pg-empty">No skill scores yet.</p>;
  }

  return (
    <div className="lp-pg-table-wrap">
      <table className="lp-pg-table">
        <thead>
          <tr>
            <th>Skill</th>
            <th>Score</th>
            <th className="lp-pg-table-bar">Progress</th>
          </tr>
        </thead>
        <tbody>
          {skills.map((skill) => {
            const empty = skill.score <= 0;
            return (
              <tr key={skill.slug}>
                <td className="lp-pg-table-skill">{skill.name}</td>
                <td className={`lp-pg-table-score${empty ? " is-empty" : ""}`}>
                  {empty ? "—" : skill.score.toFixed(2)}
                </td>
                <td className="lp-pg-table-bar">
                  <div className="lp-pg-bar" aria-hidden="true">
                    <div
                      className="lp-pg-bar-fill"
                      style={{
                        width: `${Math.max(0, Math.min(skill.score, 1)) * 100}%`,
                      }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
