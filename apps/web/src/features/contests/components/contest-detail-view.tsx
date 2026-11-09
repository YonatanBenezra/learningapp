"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { routes } from "@/config/routes";
import { EventPlay } from "@/features/contests/arena/play/EventPlay";
import { PlaySkeleton } from "@/features/contests/arena/play/PlaySkeleton";
import { EventScoreboard } from "@/features/contests/arena/scoreboard/EventScoreboard";
import { contestsApi } from "@/features/contests/contests-api";
import { ApiError } from "@/lib/api-client";
import type { ContestDetail } from "@/types/contest";
import "../contests.css";

function useContestDetail(slug: string) {
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

  return { contest, error };
}

function ContestAuthError() {
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

function ContestLoadError() {
  return (
    <main className="lp-ws-state">
      <p>Could not load this contest.</p>
    </main>
  );
}

/** Live scoreboard at `/contests/[slug]/scoreboard`. */
export function ContestScoreboardView({ slug }: { slug: string }) {
  return <EventScoreboard slug={slug} />;
}

/** Joined operator dashboard at `/contests/[slug]/arena`. */
export function ContestPlayView({ slug }: { slug: string }) {
  const router = useRouter();
  const { contest, error } = useContestDetail(slug);

  useEffect(() => {
    if (contest && !contest.entered) {
      router.replace(routes.ctfEvent(slug));
    }
  }, [contest, router, slug]);

  if (error === "auth") {
    return <ContestAuthError />;
  }
  if (error === "load") {
    return <ContestLoadError />;
  }
  if (!contest || !contest.entered) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem)] w-full flex-1 flex-col bg-[#0F1520]">
        <PlaySkeleton />
      </div>
    );
  }

  return <EventPlay initial={contest} />;
}

/** Loading shell for assessment detail (legacy contest layout). */
export function ContestDetailSkeleton() {
  return (
    <div className="lp-ct lp-ct-skel" aria-busy="true" aria-live="polite">
      <header className="lp-ct-hero">
        <div className="lp-ct-hero-copy">
          <span className="lp-ct-skel-block lp-ct-skel-kicker" />
          <span className="lp-ct-skel-block lp-ct-skel-title lp-ct-skel-title--detail" />
          <span className="lp-ct-skel-block lp-ct-skel-lead" />
          <span className="lp-ct-skel-block lp-ct-skel-lead lp-ct-skel-lead--short" />
        </div>
        <div className="lp-ct-meta">
          <span className="lp-ct-skel-block lp-ct-skel-badge" />
          <span className="lp-ct-skel-block lp-ct-skel-chip" />
        </div>
      </header>
      <div className="lp-ctd-facts" aria-hidden>
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="lp-ct-fact">
            <span className="lp-ct-skel-block lp-ct-skel-fact-val" />
            <span className="lp-ct-skel-block lp-ct-skel-fact-label" />
          </div>
        ))}
      </div>
    </div>
  );
}
