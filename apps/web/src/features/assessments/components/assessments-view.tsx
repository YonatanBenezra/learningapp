"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import type { ContestListItem } from "@/types/contest";
import { assessmentsApi } from "../assessments-api";
import "@/features/contests/contests.css";

function AssessmentsSkeleton() {
  return (
    <div className="lp-ct lp-ct-skel" aria-busy="true" aria-live="polite">
      <header className="lp-ct-hero">
        <div>
          <span className="lp-ct-skel-block lp-ct-skel-title" />
          <span className="lp-ct-skel-block lp-ct-skel-lead" />
          <span className="lp-ct-skel-block lp-ct-skel-lead lp-ct-skel-lead--short" />
        </div>
      </header>

      <div className="lp-ct-grid">
        {Array.from({ length: 2 }, (_, index) => (
          <article key={index} className="lp-ct-card">
            <div className="lp-ct-card-top">
              <span className="lp-ct-skel-block lp-ct-skel-badge" />
              <span className="lp-ct-skel-block lp-ct-skel-badge" />
            </div>
            <span className="lp-ct-skel-block lp-ct-skel-name" />
            <span className="lp-ct-skel-block lp-ct-skel-copy" />
            <span className="lp-ct-skel-block lp-ct-skel-copy lp-ct-skel-copy--short" />
            <div className="lp-ct-card-actions">
              <span className="lp-ct-skel-block lp-ct-skel-btn" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function AssessmentsView() {
  const [items, setItems] = useState<ContestListItem[] | null>(null);
  const [error, setError] = useState<"load" | null>(null);

  useEffect(() => {
    let cancelled = false;
    assessmentsApi
      .list()
      .then((result) => {
        if (!cancelled) {
          setItems(result.items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("load");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error === "load") {
    return (
      <div className="lp-ct-empty">
        <strong>Could not load assessments</strong>
        <p>Try again in a moment.</p>
      </div>
    );
  }

  if (!items) {
    return <AssessmentsSkeleton />;
  }

  return (
    <div className="lp-ct">
      <header className="lp-ct-hero">
        <div>
          <h1 className="lp-ct-title">Verified assessments</h1>
          <p className="lp-ct-lead">
            Timed sittings — novel problems, no hints, one per Pro season. Traces
            unlock when the sitting closes.
          </p>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="lp-ct-empty">
          <strong>No assessment window open</strong>
          <p>
            Run <code>npm run prisma:seed</code> after migrating to load VA1, or
            check the season window dates.
          </p>
        </div>
      ) : (
        <div className="lp-ct-grid">
          {items.map((item) => (
            <article key={item.slug} className="lp-ct-card">
              <div className="lp-ct-card-top">
                <span className="lp-ct-badge">Assessment</span>
                {item.seasonKey ? (
                  <span className="lp-ct-badge">{item.seasonKey}</span>
                ) : null}
              </div>
              <h2 className="lp-ct-card-title">{item.title}</h2>
              <p className="lp-ct-card-copy">{item.intent}</p>
              <div className="lp-ct-card-actions">
                <Link href={routes.assessment(item.slug)} className="lp-ct-btn">
                  {item.canEnter ? "Start sitting" : item.entered ? "Continue" : "View"}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
