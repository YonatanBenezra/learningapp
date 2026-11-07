"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { EventDetailsPage } from "@/features/contests/event-details/event-details-page";
import { EventDetailsSkeleton } from "@/features/contests/event-details/event-details-skeleton";
import { mapContestToEventDetails } from "@/features/contests/event-details/map-contest-to-details";
import { contestsApi } from "@/features/contests/contests-api";
import { ApiError } from "@/lib/api-client";
import type { ContestDetail } from "@/types/contest";

export function EventDetailsView({ slug }: { slug: string }) {
  const [contest, setContest] = useState<ContestDetail | null>(null);
  const [error, setError] = useState<"auth" | "load" | null>(null);

  useEffect(() => {
    document.documentElement.dataset.workspace = "dashboard";
    return () => {
      delete document.documentElement.dataset.workspace;
    };
  }, []);

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
        if (!cancelled) {
          setError(caught instanceof ApiError && caught.status === 401 ? "auth" : "load");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (error === "auth") {
    return (
      <main className="lp-dash-figma-main flex flex-1 items-center justify-center px-4 py-24 text-[#A4B1CD]">
        <p>
          Sign in to view this event.{" "}
          <Link href={routes.signIn} className="text-[#9FEF00] underline">
            Sign in
          </Link>
        </p>
      </main>
    );
  }

  if (error === "load") {
    return (
      <main className="lp-dash-figma-main flex flex-1 items-center justify-center px-4 py-24 text-[#A4B1CD]">
        <p>Could not load this event.</p>
      </main>
    );
  }

  if (!contest) {
    return <EventDetailsSkeleton />;
  }

  return <EventDetailsPage event={mapContestToEventDetails(contest)} />;
}
