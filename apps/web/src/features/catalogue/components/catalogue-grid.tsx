"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { catalogueApi } from "@/features/catalogue/catalogue-api";
import { ApiError } from "@/lib/api-client";
import type { Exercise } from "@/types/exercise";
import { ExerciseCard } from "./exercise-card";

export function CatalogueGrid() {
  const [items, setItems] = useState<Exercise[] | null>(null);
  const [error, setError] = useState<"auth" | "load" | null>(null);

  useEffect(() => {
    let cancelled = false;
    catalogueApi
      .list()
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
      <div className="lp-panel">
        <p className="lp-panel-title">Sign in required</p>
        <p className="mt-2 text-sm lp-muted">
          Sign in to browse the catalogue.{" "}
          <Link href={routes.login} className="lp-link">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  if (error === "load") {
    return (
      <div className="lp-panel">
        <p className="lp-panel-title">Could not load exercises</p>
        <p className="mt-2 text-sm lp-muted">
          Check that the API is running, then refresh this page.
        </p>
      </div>
    );
  }

  if (!items) {
    return <p className="text-sm lp-muted">Loading catalogue…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="lp-panel">
        <p className="lp-panel-title">No exercises published yet</p>
        <p className="mt-2 text-sm lp-muted">
          Seed the catalogue from the API, then reload.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="mb-4 text-sm lp-muted">
        {items.length} exercise{items.length === 1 ? "" : "s"} available
      </p>
      <div className="lp-grid">
        {items.map((exercise) => (
          <ExerciseCard key={exercise.slug} exercise={exercise} />
        ))}
      </div>
    </>
  );
}
