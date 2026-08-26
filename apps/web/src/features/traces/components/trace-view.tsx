"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api-client";
import { tracesApi } from "@/features/traces/traces-api";
import type { RunTrace } from "@/types/trace";

type TraceViewProps = {
  runId: string;
};

export function TraceView({ runId }: TraceViewProps) {
  const [trace, setTrace] = useState<RunTrace | null>(null);
  const [error, setError] = useState<"auth" | "missing" | "load" | null>(null);

  useEffect(() => {
    let cancelled = false;
    tracesApi
      .getByRunId(runId)
      .then((result) => {
        if (!cancelled) {
          setTrace(result);
        }
      })
      .catch((caught: unknown) => {
        if (cancelled) {
          return;
        }
        if (caught instanceof ApiError && caught.status === 401) {
          setError("auth");
          return;
        }
        if (caught instanceof ApiError && caught.status === 404) {
          setError("missing");
          return;
        }
        setError("load");
      });
    return () => {
      cancelled = true;
    };
  }, [runId]);

  if (error === "auth") {
    return (
      <p className="text-sm">
        Sign in to view this trace.{" "}
        <Link
          href={`${routes.login}?next=${encodeURIComponent(routes.trace(runId))}`}
          className="underline"
        >
          Sign in
        </Link>
      </p>
    );
  }

  if (error === "missing") {
    return <p className="text-sm">Trace is not ready for this run.</p>;
  }

  if (error === "load") {
    return <p className="text-sm">Could not load this trace.</p>;
  }

  if (!trace) {
    return <p className="text-sm opacity-70">Loading…</p>;
  }

  const queries = trace.queries ?? [];

  return (
    <section className="space-y-4 text-sm">
      <p>
        <Link href={routes.run(runId)} className="underline">
          Back to run
        </Link>
      </p>
      <dl className="grid gap-1 sm:grid-cols-2">
        <div>Chunks: {trace.chunkCount ?? "—"}</div>
        <div>top-k: {trace.k ?? "—"}</div>
        <div>
          Tokens: {trace.tokensIn ?? 0} in / {trace.tokensOut ?? 0} out
        </div>
        <div>Cost (EUR micros): {trace.costEurMicros ?? 0}</div>
      </dl>
      {trace.payload ? (
        <pre className="overflow-x-auto border p-2 text-xs">
          {JSON.stringify(trace.payload, null, 2)}
        </pre>
      ) : null}
      {queries.length === 0 ? (
        <p className="opacity-70">No retrieval steps recorded.</p>
      ) : (
        <ol className="space-y-4">
          {queries.map((query) => (
            <li key={`${query.source}-${query.question}`} className="border p-3" data-testid="trace-query">
              <p className="text-xs uppercase tracking-wide opacity-70">
                {query.source}
              </p>
              <p className="mt-1 font-medium">{query.question}</p>
              <ul className="mt-2 space-y-2">
                {query.retrieved.map((hit) => (
                  <li key={hit.chunkId} className="opacity-80">
                    <span className="font-medium">
                      {hit.docId} · {hit.score}
                    </span>
                    <p className="mt-1">{hit.text}</p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
