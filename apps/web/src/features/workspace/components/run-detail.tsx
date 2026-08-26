"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { workspaceApi } from "@/features/workspace/workspace-api";
import { ApiError } from "@/lib/api-client";
import type { Grade } from "@/types/grade";
import type { Run } from "@/types/run";
import { RunPanel } from "@/features/workspace/components/run-panel";

type RunDetailProps = {
  runId: string;
};

export function RunDetail({ runId }: RunDetailProps) {
  const [run, setRun] = useState<Run | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [error, setError] = useState<"auth" | "missing" | "load" | null>(null);

  useEffect(() => {
    let cancelled = false;
    workspaceApi
      .getRun(runId)
      .then(async (result) => {
        if (cancelled) {
          return;
        }
        setRun(result);
        if (result.status === "succeeded") {
          try {
            setGrade(await workspaceApi.getGrade(runId));
          } catch {
            setGrade(null);
          }
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
        Sign in to view this run.{" "}
        <Link
          href={`${routes.login}?next=${encodeURIComponent(routes.run(runId))}`}
          className="underline"
        >
          Sign in
        </Link>
      </p>
    );
  }

  if (error === "missing") {
    return <p className="text-sm">Run not found.</p>;
  }

  if (error === "load") {
    return <p className="text-sm">Could not load this run.</p>;
  }

  if (!run) {
    return <p className="text-sm opacity-70">Loading…</p>;
  }

  return (
    <div className="max-w-xl">
      {run.title && run.exerciseSlug ? (
        <p className="mb-4 text-sm">
          <Link href={routes.exercise(run.exerciseSlug)} className="underline">
            {run.title}
          </Link>
        </p>
      ) : null}
      <RunPanel run={run} grade={grade} />
    </div>
  );
}
