"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { routes } from "@/config/routes";
import { SIMULATOR_LABELS, SIMULATORS, type SimulatorSlug } from "@/config/simulators";
import { catalogueApi } from "@/features/catalogue/catalogue-api";
import { ApiError } from "@/lib/api-client";
import type { Difficulty, Exercise } from "@/types/exercise";
import { CatalogueSkeleton } from "./catalogue-skeleton";
import { ExerciseCard } from "./exercise-card";

const DIFFICULTY_FILTERS: { id: Difficulty | "all"; label: string }[] = [
  { id: "all", label: "All levels" },
  { id: "E", label: "Easy" },
  { id: "M", label: "Medium" },
  { id: "H", label: "Hard" },
];

export function CatalogueGrid() {
  const [items, setItems] = useState<Exercise[] | null>(null);
  const [error, setError] = useState<"auth" | "load" | null>(null);
  const [track, setTrack] = useState<SimulatorSlug | "all">("all");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");

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

  const visible = useMemo(() => {
    if (!items) {
      return [];
    }
    return items.filter((exercise) => {
      const trackOk = track === "all" || exercise.simulator === track;
      const levelOk = difficulty === "all" || exercise.difficulty === difficulty;
      return trackOk && levelOk;
    });
  }, [difficulty, items, track]);

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
    return <CatalogueSkeleton />;
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
      <div className="lp-cat-toolbar">
        <div className="lp-filter" role="group" aria-label="Track">
          <button
            type="button"
            className={`lp-filter-chip${track === "all" ? " is-active" : ""}`}
            onClick={() => setTrack("all")}
          >
            All tracks
          </button>
          {SIMULATORS.map((slug) => (
            <button
              key={slug}
              type="button"
              className={`lp-filter-chip${track === slug ? " is-active" : ""}`}
              onClick={() => setTrack(slug)}
            >
              {SIMULATOR_LABELS[slug]}
            </button>
          ))}
        </div>
        <div className="lp-filter" role="group" aria-label="Difficulty">
          {DIFFICULTY_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`lp-filter-chip${difficulty === item.id ? " is-active" : ""}`}
              onClick={() => setDifficulty(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <p className="lp-cat-count">
        {visible.length} of {items.length} exercise
        {items.length === 1 ? "" : "s"}
      </p>
      {visible.length === 0 ? (
        <div className="lp-panel">
          <p className="lp-panel-title">No exercises match these filters</p>
          <p className="mt-2 text-sm lp-muted">
            Clear a filter to see more of the catalogue.
          </p>
        </div>
      ) : (
        <div className="lp-grid lp-grid-catalogue">
          {visible.map((exercise) => (
            <ExerciseCard key={exercise.slug} exercise={exercise} />
          ))}
        </div>
      )}
    </>
  );
}
