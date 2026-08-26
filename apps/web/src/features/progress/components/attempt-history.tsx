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
      <section className="border p-4">
        <h2 className="font-medium">Attempts</h2>
        <p className="mt-2 text-sm">
          Sign in to see attempts.{" "}
          <Link
            href={`${routes.login}?next=${encodeURIComponent(routes.progress)}`}
            className="underline"
          >
            Sign in
          </Link>
        </p>
      </section>
    );
  }

  if (error === "load") {
    return (
      <section className="border p-4">
        <h2 className="font-medium">Attempts</h2>
        <p className="mt-2 text-sm">Could not load attempts.</p>
      </section>
    );
  }

  return (
    <section className="border p-4">
      <h2 className="font-medium">Attempts</h2>
      {!items ? (
        <p className="mt-2 text-sm opacity-70">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-2 text-sm opacity-70">No attempts yet.</p>
      ) : (
        <ul className="mt-3 space-y-3 text-sm">
          {items.map((item) => (
            <li key={item.attemptId} className="border p-2">
              <Link
                href={routes.exercise(item.exerciseSlug)}
                className="underline"
              >
                {item.title}
              </Link>
              <p className="mt-1 opacity-70">
                {item.status}
                {item.verdict ? ` · ${item.verdict}` : ""}
              </p>
              {item.runId ? (
                <p className="mt-1">
                  <Link href={routes.run(item.runId)} className="underline">
                    Run
                  </Link>
                  {" · "}
                  <Link href={routes.trace(item.runId)} className="underline">
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
