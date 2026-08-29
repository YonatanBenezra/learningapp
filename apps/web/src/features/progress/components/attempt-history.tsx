"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { progressApi } from "@/features/progress/progress-api";
import { ApiError } from "@/lib/api-client";
import type { ProgressItem } from "@/types/progress";

export function AttemptHistory() {
  const [items, setItems] = useState<ProgressItem[] | null>(null);
  const [error, setError] = useState<"auth" | "load" | null>(null);

  useEffect(() => {
    let cancelled = false;
    progressApi
      .getMine()
      .then((result) => {
        if (!cancelled) {
          setItems(result.items);
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
        <p className="lp-panel-eyebrow">Timeline</p>
        <h2 className="lp-panel-title">Recent attempts</h2>
        <p className="mt-3 text-sm lp-muted">
          Sign in to view attempts.{" "}
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
        <p className="lp-panel-eyebrow">Timeline</p>
        <h2 className="lp-panel-title">Recent attempts</h2>
        <p className="mt-3 text-sm lp-muted">Could not load attempts.</p>
      </section>
    );
  }

  return (
    <section className="lp-panel">
      <p className="lp-panel-eyebrow">Timeline</p>
      <h2 className="lp-panel-title">Recent attempts</h2>
      {!items ? (
        <p className="mt-3 text-sm lp-muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-3 text-sm lp-muted">No attempts yet.</p>
      ) : (
        <ul className="mt-4 space-y-3 text-sm">
          {items.map((item) => (
            <li key={item.attemptId} className="lp-list-item">
              <Link
                href={routes.exercise(item.exerciseSlug)}
                className="lp-link font-medium"
              >
                {item.title}
              </Link>
              <p className="mt-1 lp-muted">
                {item.status}
                {item.verdict ? ` · ${item.verdict}` : ""}
              </p>
              {item.runId ? (
                <p className="mt-2 flex flex-wrap gap-3">
                  <Link href={routes.run(item.runId)} className="lp-link">
                    Run
                  </Link>
                  <Link href={routes.trace(item.runId)} className="lp-link">
                    Trace
                  </Link>
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
