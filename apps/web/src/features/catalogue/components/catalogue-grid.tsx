"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { routes } from "@/config/routes";
import { SIMULATOR_LABELS, SIMULATORS, type SimulatorSlug } from "@/config/simulators";
import { catalogueApi } from "@/features/catalogue/catalogue-api";
import { PathStrip } from "@/features/paths/components/path-strip";
import { ApiError } from "@/lib/api-client";
import type { Difficulty, Exercise } from "@/types/exercise";
import { CatalogueSkeleton } from "./catalogue-skeleton";
import { ExerciseCard } from "./exercise-card";
import { ExerciseRow } from "./exercise-row";

const PAGE_SIZE = 15;

type ExerciseView = "grid" | "list";

const DIFFICULTY_FILTERS: { id: Difficulty | "all"; label: string }[] = [
  { id: "all", label: "All levels" },
  { id: "E", label: "Easy" },
  { id: "M", label: "Medium" },
  { id: "H", label: "Hard" },
];

function buildPageItems(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, total, current]);
  for (let offset = 1; offset <= 1; offset += 1) {
    pages.add(current - offset);
    pages.add(current + offset);
  }
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= total - 2) {
    pages.add(total - 1);
    pages.add(total - 2);
    pages.add(total - 3);
  }

  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const items: Array<number | "ellipsis"> = [];
  for (const page of sorted) {
    const last = items[items.length - 1];
    if (typeof last === "number" && page - last > 1) {
      items.push("ellipsis");
    }
    items.push(page);
  }
  return items;
}

function SelectCaret() {
  return (
    <svg className="lp-cat-select-caret" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2.5 4.5L6 8l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GridViewIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.75" y="1.75" width="5.2" height="5.2" rx="1.1" fill="currentColor" />
      <rect x="9.05" y="1.75" width="5.2" height="5.2" rx="1.1" fill="currentColor" />
      <rect x="1.75" y="9.05" width="5.2" height="5.2" rx="1.1" fill="currentColor" />
      <rect x="9.05" y="9.05" width="5.2" height="5.2" rx="1.1" fill="currentColor" />
    </svg>
  );
}

function ListViewIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.75" y="2.4" width="12.5" height="2.5" rx="1.1" fill="currentColor" />
      <rect x="1.75" y="6.75" width="12.5" height="2.5" rx="1.1" fill="currentColor" />
      <rect x="1.75" y="11.1" width="12.5" height="2.5" rx="1.1" fill="currentColor" />
    </svg>
  );
}

export function CatalogueGrid() {
  const [items, setItems] = useState<Exercise[] | null>(null);
  const [error, setError] = useState<"auth" | "load" | null>(null);
  const [track, setTrack] = useState<SimulatorSlug | "all">("all");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ExerciseView>("grid");

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

  useEffect(() => {
    setPage(1);
  }, [track, difficulty, query]);

  const visible = useMemo(() => {
    if (!items) {
      return [];
    }
    const needle = query.trim().toLowerCase();
    return items.filter((exercise) => {
      const trackOk = track === "all" || exercise.simulator === track;
      const levelOk = difficulty === "all" || exercise.difficulty === difficulty;
      if (!trackOk || !levelOk) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const haystack = [
        exercise.title,
        SIMULATOR_LABELS[exercise.simulator],
        ...exercise.skillTags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [difficulty, items, query, track]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return visible.slice(start, start + PAGE_SIZE);
  }, [currentPage, visible]);
  const rangeStart = visible.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, visible.length);
  const filtersActive = track !== "all" || difficulty !== "all" || query.trim().length > 0;

  if (error === "auth") {
    return (
      <div className="lp-cat-empty">
        <strong>Sign in required</strong>
        <p>
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
      <div className="lp-cat-empty">
        <strong>Could not load exercises</strong>
        <p>Check that the API is running, then refresh this page.</p>
      </div>
    );
  }

  if (!items) {
    return <CatalogueSkeleton />;
  }

  return (
    <div className="lp-cat">
      <header className="lp-cat-hero">
        <div className="lp-cat-hero-copy">
          <h1 className="lp-cat-title">Catalogue</h1>
          <p className="lp-cat-lead">
            Graded exercises across RAG, prompts, evaluation, guardrails, agents,
            and benchmarks. Follow a path or open any set.
          </p>
        </div>

        <div className="lp-cat-controls">
          <label className="lp-cat-search">
            <span className="sr-only">Search exercises</span>
            <svg className="lp-cat-search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M16.2 16.2L20 20"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, track, skill…"
              autoComplete="off"
            />
          </label>

          <label className="lp-cat-field">
            <span className="sr-only">Track</span>
            <span className="lp-cat-select">
              <select
                value={track}
                onChange={(event) => setTrack(event.target.value as SimulatorSlug | "all")}
                aria-label="Track"
              >
                <option value="all">All tracks</option>
                {SIMULATORS.map((slug) => (
                  <option key={slug} value={slug}>
                    {SIMULATOR_LABELS[slug]}
                  </option>
                ))}
              </select>
              <SelectCaret />
            </span>
          </label>

          <label className="lp-cat-field">
            <span className="sr-only">Level</span>
            <span className="lp-cat-select">
              <select
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(event.target.value as Difficulty | "all")
                }
                aria-label="Level"
              >
                {DIFFICULTY_FILTERS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <SelectCaret />
            </span>
          </label>

          {filtersActive ? (
            <button
              type="button"
              className="lp-cat-clear"
              onClick={() => {
                setTrack("all");
                setDifficulty("all");
                setQuery("");
                setPage(1);
              }}
            >
              Clear
            </button>
          ) : null}
        </div>
      </header>

      <PathStrip />

      <section aria-label="Exercises">
        <div className="lp-ex-block-head">
          <h2>Exercises</h2>
          <div className="lp-ex-block-tools">
            <p>
              {visible.length === 0
                ? "0 results"
                : `Showing ${rangeStart}–${rangeEnd} of ${visible.length}`}
            </p>
            <div className="lp-view-toggle" role="group" aria-label="Exercise view">
              <button
                type="button"
                aria-pressed={view === "grid"}
                aria-label="Grid view"
                title="Grid view"
                onClick={() => setView("grid")}
              >
                <GridViewIcon />
              </button>
              <button
                type="button"
                aria-pressed={view === "list"}
                aria-label="List view"
                title="List view"
                onClick={() => setView("list")}
              >
                <ListViewIcon />
              </button>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="lp-cat-empty">
            <strong>No exercises published yet</strong>
            <p>Seed the catalogue from the API, then reload.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="lp-cat-empty">
            <strong>No matches</strong>
            <p>Try another track, level, or clear search.</p>
          </div>
        ) : (
          <>
            {view === "grid" ? (
              <div className="lp-ex-grid">
                {pageItems.map((exercise) => (
                  <ExerciseCard key={exercise.slug} exercise={exercise} />
                ))}
              </div>
            ) : (
              <div className="lp-ex-list">
                {pageItems.map((exercise) => (
                  <ExerciseRow key={exercise.slug} exercise={exercise} />
                ))}
              </div>
            )}

            {pageCount > 1 ? (
              <nav className="lp-cat-pager" aria-label="Exercise pages">
                <button
                  type="button"
                  className="lp-cat-page"
                  disabled={currentPage <= 1}
                  aria-label="Previous page"
                  onClick={() => {
                    setPage((value) => Math.max(1, value - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M10 3.5L5.5 8 10 12.5"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {buildPageItems(currentPage, pageCount).map((item, index) =>
                  item === "ellipsis" ? (
                    <span key={`e-${index}`} className="lp-cat-page-ellipsis" aria-hidden="true">
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      className={`lp-cat-page${item === currentPage ? " is-active" : ""}`}
                      aria-label={`Page ${item}`}
                      aria-current={item === currentPage ? "page" : undefined}
                      onClick={() => {
                        setPage(item);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      {item}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  className="lp-cat-page"
                  disabled={currentPage >= pageCount}
                  aria-label="Next page"
                  onClick={() => {
                    setPage((value) => Math.min(pageCount, value + 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M6 3.5L10.5 8 6 12.5"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </nav>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
