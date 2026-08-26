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
      <section className="border p-4">
        <h2 className="font-medium">Skills</h2>
        <p className="mt-2 text-sm">
          Sign in to see progress.{" "}
          <Link
            href={`${routes.login}?next=${encodeURIComponent(routes.progress)}`}
            className="underline"
          >
            Sign in
          </Link>
        </p>
      </section>
    );
  }

  if (error === "load") {
    return (
      <section className="border p-4">
        <h2 className="font-medium">Skills</h2>
        <p className="mt-2 text-sm">Could not load skills.</p>
      </section>
    );
  }

  return (
    <section className="border p-4">
      <h2 className="font-medium">Skills</h2>
      {!progress ? (
        <p className="mt-2 text-sm opacity-70">Loading…</p>
      ) : (
        <>
          <p className="mt-2 text-sm">
            {progress.solves} solve{progress.solves === 1 ? "" : "s"} ·{" "}
            {progress.attempts} attempt{progress.attempts === 1 ? "" : "s"}
          </p>
          {progress.skills.length === 0 ? (
            <p className="mt-2 text-sm opacity-70">No skill scores yet.</p>
          ) : (
            <ul className="mt-3 space-y-1 text-sm">
              {progress.skills.map((skill) => (
                <li key={skill.slug}>
                  {skill.name}: {skill.score.toFixed(2)}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
