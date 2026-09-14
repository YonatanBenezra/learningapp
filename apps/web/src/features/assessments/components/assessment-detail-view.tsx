"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { routes } from "@/config/routes";
import { ContestDetailSkeleton } from "@/features/contests/components/contest-detail-view";
import { ContestView } from "@/features/contests/components/contest-view";
import { assessmentsApi } from "@/features/assessments/assessments-api";
import { ApiError } from "@/lib/api-client";
import type { ContestDetail } from "@/types/contest";
import "@/features/contests/contests.css";

export function AssessmentDetailView({ slug }: { slug: string }) {
  const [assessment, setAssessment] = useState<ContestDetail | null>(null);
  const [error, setError] = useState<"auth" | "load" | null>(null);

  useEffect(() => {
    let cancelled = false;
    assessmentsApi
      .getBySlug(slug)
      .then((result) => {
        if (!cancelled) {
          setAssessment(result);
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
          Sign in to view assessments.{" "}
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
        <p>Could not load this assessment.</p>
      </main>
    );
  }

  if (!assessment) {
    return <ContestDetailSkeleton />;
  }

  return <ContestView initial={assessment} variant="assessment" />;
}
