"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { routes } from "@/config/routes";
import { ContestView } from "@/features/contests/components/contest-view";
import { contestsApi } from "@/features/contests/contests-api";
import { ApiError } from "@/lib/api-client";
import type { ContestDetail } from "@/types/contest";
import "../contests.css";

export function ContestDetailView({ slug }: { slug: string }) {
  const [contest, setContest] = useState<ContestDetail | null>(null);
  const [error, setError] = useState<"auth" | "load" | null>(null);

  useEffect(() => {
    let cancelled = false;
    contestsApi
      .getBySlug(slug)
      .then((result) => {
        if (!cancelled) {
          setContest(result);
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
      <main className="lp-ws-state">
        <p>
          Sign in to view contests.{" "}
          <Link href={routes.login} className="lp-link">
            Sign in
          </Link>
        </p>
      </main>
    );
  }

  if (error === "load") {
    return (
      <main className="lp-ws-state">
        <p>Could not load this contest.</p>
      </main>
    );
  }

  if (!contest) {
    return <ContestDetailSkeleton />;
  }

  return <ContestView initial={contest} />;
}

function ContestDetailSkeleton() {
  return (
    <div className="lp-ct lp-ct-skel" aria-busy="true" aria-live="polite">
      <header className="lp-ct-hero">
        <div>
          <span className="lp-ct-skel-block lp-ct-skel-eyebrow" />
          <span className="lp-ct-skel-block lp-ct-skel-title" />
          <span className="lp-ct-skel-block lp-ct-skel-lead" />
          <span className="lp-ct-skel-block lp-ct-skel-lead lp-ct-skel-lead--short" />
        </div>
        <div className="lp-ct-meta">
          <span className="lp-ct-skel-block lp-ct-skel-badge" />
          <span className="lp-ct-skel-block lp-ct-skel-chip" />
        </div>
      </header>

      <div className="lp-ctd-facts">
        {Array.from({ length: 6 }, (_, index) => (
          <span key={index} className="lp-ct-skel-block lp-ct-skel-fact" />
        ))}
      </div>

      <section aria-hidden="true">
        <div className="lp-ctd-section-head">
          <div>
            <span className="lp-ct-skel-block lp-ct-skel-section" />
            <span className="lp-ct-skel-block lp-ct-skel-copy lp-ct-skel-copy--short" />
          </div>
          <span className="lp-ct-skel-block lp-ct-skel-btn" />
        </div>

        <div className="lp-ctd-grid">
          {Array.from({ length: 2 }, (_, index) => (
            <article key={index} className="lp-ctd-card">
              <div className="lp-ct-card-top">
                <span className="lp-ct-skel-block lp-ct-skel-badge" />
                <span className="lp-ct-skel-block lp-ct-skel-badge" />
              </div>
              <span className="lp-ct-skel-block lp-ct-skel-name" />
              <span className="lp-ct-skel-block lp-ct-skel-copy lp-ct-skel-copy--short" />
              <span className="lp-ct-skel-block lp-ct-skel-btn lp-ctd-skel-btn" />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
