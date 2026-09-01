"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { routes } from "@/config/routes";
import { ContestView } from "@/features/contests/components/contest-view";
import { contestsApi } from "@/features/contests/contests-api";
import { ApiError } from "@/lib/api-client";
import type { ContestDetail } from "@/types/contest";

export default function ContestDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const [contest, setContest] = useState<ContestDetail | null>(null);
  const [error, setError] = useState<"auth" | "load" | null>(null);

  useEffect(() => {
    let cancelled = false;
    contestsApi
      .getBySlug(params.slug)
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
  }, [params.slug]);

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
    return (
      <main className="lp-ws-state">
        <p>Loading…</p>
      </main>
    );
  }

  return <ContestView initial={contest} />;
}
