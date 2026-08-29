"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { progressApi } from "@/features/progress/progress-api";
import { ApiError } from "@/lib/api-client";
import type { Progress } from "@/types/progress";

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

  if (error === "auth") {
    return (
      <section className="lp-panel">
        <p className="lp-panel-eyebrow">Competency</p>
        <h2 className="lp-panel-title">Skill scores</h2>
        <p className="mt-3 text-sm lp-muted">
          Sign in to view progress.{" "}
          <Link
            href={`${routes.login}?next=${encodeURIComponent(routes.progress)}`}
            className="lp-link"
          >
            Sign in
          </Link>
        </p>
      </section>
    );
  }

  if (error === "load") {
    return (
      <section className="lp-panel">
        <p className="lp-panel-eyebrow">Competency</p>
        <h2 className="lp-panel-title">Skill scores</h2>
        <p className="mt-3 text-sm lp-muted">Could not load skills.</p>
      </section>
    );
  }

  return (
    <section className="lp-panel">
      <p className="lp-panel-eyebrow">Competency</p>
      <h2 className="lp-panel-title">Skill scores</h2>
      {!progress ? (
        <p className="mt-3 text-sm lp-muted">Loading…</p>
      ) : (
        <>
          <p className="mt-3 text-sm">
            {progress.solves} solve{progress.solves === 1 ? "" : "s"} ·{" "}
            {progress.attempts} attempt{progress.attempts === 1 ? "" : "s"}
          </p>
          {progress.skills.length === 0 ? (
            <p className="mt-3 text-sm lp-muted">No skill scores yet.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {progress.skills.map((skill) => (
                <li
                  key={skill.slug}
                  className="flex items-center justify-between gap-3 border-b border-[var(--lp-border)] pb-2 last:border-b-0"
                >
                  <span>{skill.name}</span>
                  <span className="font-medium tabular-nums text-[var(--lp-brand)]">
                    {skill.score.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
