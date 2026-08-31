"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { progressApi } from "@/features/progress/progress-api";
import { ApiError } from "@/lib/api-client";
import type { Progress } from "@/types/progress";
import { SkillsTable } from "./skills-table";

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
      {progress ? <SkillsTable skills={progress.skills} /> : null}
    </section>
  );
}
