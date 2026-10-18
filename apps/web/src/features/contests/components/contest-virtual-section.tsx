"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { SIMULATOR_LABELS, type SimulatorSlug } from "@/config/simulators";
import { ApiError } from "@/lib/api-client";
import { contestsApi } from "@/features/contests/contests-api";
import type { ContestVirtualDetail } from "@/types/contest";

const DIFFICULTY_LABELS: Record<string, string> = {
  E: "Easy",
  M: "Medium",
  H: "Hard",
};

type Props = {
  slug: string;
  pointsPerProblem: number;
};

export function ContestVirtualSection({ slug, pointsPerProblem }: Props) {
  const [virtual, setVirtual] = useState<ContestVirtualDetail | null>(null);
  const [error, setError] = useState<"auth" | "load" | null>(null);

  useEffect(() => {
    let cancelled = false;
    contestsApi
      .getVirtual(slug)
      .then((result) => {
        if (!cancelled) {
          setVirtual(result);
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
  }, [slug]);

  if (error === "auth") {
    return (
      <section className="lp-ctd-virtual" aria-label="Virtual practice">
        <p className="lp-ctd-notice">
          Sign in to practice this contest after close.{" "}
          <Link href={routes.login} className="lp-link">
            Sign in
          </Link>
        </p>
      </section>
    );
  }

  if (error === "load" || !virtual) {
    return null;
  }

  return (
    <section className="lp-ctd-virtual" aria-label="Virtual practice">
      <div className="lp-ctd-section-head">
        <div>
          <h2 className="lp-ctd-section-title">Virtual practice</h2>
          <p className="lp-ctd-section-note">
            Same problem set for you — not ranked, no contest entry. Hints stay off.
          </p>
        </div>
      </div>
      <div className="lp-ctd-grid">
        {virtual.problems.map((problem) => (
          <article key={problem.slug} className="lp-ctd-card">
            <div className="lp-ct-card-top">
              <span className="lp-ct-badge">
                {DIFFICULTY_LABELS[problem.difficulty] ?? problem.difficulty}
              </span>
              <span className="lp-ctd-verdict lp-ctd-verdict--todo">Practice</span>
            </div>
            <h3 className="lp-ct-card-title">{problem.title}</h3>
            <p className="lp-ct-card-copy">
              {SIMULATOR_LABELS[problem.simulator as SimulatorSlug] ?? problem.simulator}
            </p>
            <Link
              href={routes.contestPracticeProblem(slug, problem.slug)}
              className="lp-ct-btn lp-ctd-card-btn"
            >
              Solve
            </Link>
            <p className="lp-ctd-enter-card-note">Up to {pointsPerProblem} pts if graded</p>
          </article>
        ))}
      </div>
    </section>
  );
}
