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

  return (
    <section className="lp-panel lp-pg-panel">
      <div className="lp-pg-panel-top">
        <div>
          <p className="lp-panel-eyebrow">Timeline</p>
          <h2 className="lp-panel-title">Solve history</h2>
        </div>
      </div>
      {error === "auth" ? (
        <p className="lp-pg-note">
          Sign in to view attempts.{" "}
          <Link
            href={`${routes.login}?next=${encodeURIComponent(routes.progress)}`}
            className="lp-link"
          >
            Sign in
          </Link>
        </p>
      ) : null}
      {error === "load" ? (
        <p className="lp-pg-note">Could not load attempts.</p>
      ) : null}
      {!error && !items ? (
        <div className="lp-pg-skel" aria-hidden="true">
          <span className="lp-skel-line" />
          <span className="lp-skel-line" />
          <span className="lp-skel-line" />
        </div>
      ) : null}
      {items && items.length === 0 ? (
        <p className="lp-pg-empty">No attempts yet.</p>
      ) : null}
      {items && items.length > 0 ? (
        <div className="lp-pg-table-wrap">
          <table className="lp-pg-table">
            <thead>
              <tr>
                <th>Exercise</th>
                <th>Result</th>
                <th>Status</th>
                <th>Date</th>
                <th>Links</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.attemptId}>
                  <td>
                    <Link
                      href={routes.exercise(item.exerciseSlug)}
                      className="lp-pg-table-exercise"
                    >
                      {item.title}
                    </Link>
                  </td>
                  <td>
                    <span className={`lp-pg-pill ${pillClass(item.verdict)}`}>
                      {item.verdict ?? item.status}
                    </span>
                  </td>
                  <td className="lp-pg-table-status">{item.status}</td>
                  <td className="lp-pg-table-date">
                    {item.startedAt ? formatWhen(item.startedAt) : "—"}
                  </td>
                  <td>
                    {item.runId ? (
                      <span className="lp-pg-table-links">
                        <Link href={routes.run(item.runId)} className="lp-link">
                          Run
                        </Link>
                        <Link href={routes.trace(item.runId)} className="lp-link">
                          Trace
                        </Link>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function pillClass(verdict: string | null) {
  const value = verdict?.toLowerCase();
  if (value === "fail") {
    return "lp-pg-pill--fail";
  }
  if (value === "pass") {
    return "lp-pg-pill--pass";
  }
  return "";
}

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(date);
}
