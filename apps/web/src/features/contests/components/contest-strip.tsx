"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import type { ContestListItem } from "@/types/contest";
import { contestsApi } from "../contests-api";
import { ContestCard } from "./contest-card";

export function ContestStrip() {
  const [items, setItems] = useState<ContestListItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    contestsApi
      .list()
      .then((result) => {
        if (!cancelled) {
          setItems(result.items);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled && !(caught instanceof ApiError && caught.status === 401)) {
          setItems([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="lp-path-strip" aria-label="Contests">
      <div className="lp-path-strip-head">
        <p className="lp-panel-eyebrow">Contests</p>
        <p className="lp-cat-count lp-path-strip-lead">
          Timed, novel problems. Pro only. Hints off.
        </p>
      </div>
      <div className="lp-grid lp-grid-catalogue">
        {items.map((contest) => (
          <ContestCard key={contest.slug} contest={contest} />
        ))}
      </div>
    </section>
  );
}
