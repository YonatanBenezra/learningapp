"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api-client";
import type { PathListItem } from "@/types/path";
import { pathsApi } from "../paths-api";
import "../paths.css";

type FilterId = "all" | "active" | "new" | "done";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "In progress" },
  { id: "new", label: "Not started" },
  { id: "done", label: "Completed" },
];

function statusOf(path: PathListItem): Exclude<FilterId, "all"> {
  if (path.complete) {
    return "done";
  }
  if (path.passedCount > 0) {
    return "active";
  }
  return "new";
}

function statusLabel(path: PathListItem) {
  const status = statusOf(path);
  if (status === "done") {
    return "Completed";
  }
  if (status === "active") {
    return "In progress";
  }
  return "Not started";
}

function actionLabel(path: PathListItem) {
  if (path.complete) {
    return "Review path";
  }
  if (path.passedCount > 0) {
    return "Continue";
  }
  return "Start path";
}

function PathsSkeleton() {
  return (
    <div className="lp-paths lp-paths-skel" aria-busy="true" aria-live="polite">
      <header className="lp-paths-hero">
        <div>
          <span className="lp-paths-skel-block lp-paths-skel-title" />
          <span className="lp-paths-skel-block lp-paths-skel-lead" />
          <span className="lp-paths-skel-block lp-paths-skel-lead lp-paths-skel-lead--short" />
        </div>
        <div className="lp-paths-meta">
          <span className="lp-paths-skel-block lp-paths-skel-chip" />
          <span className="lp-paths-skel-block lp-paths-skel-chip" />
        </div>
      </header>

      <div className="lp-paths-filters">
        {Array.from({ length: 4 }, (_, index) => (
          <span key={index} className="lp-paths-skel-block lp-paths-skel-filter" />
        ))}
      </div>

      <div className="lp-paths-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <article key={index} className="lp-paths-card">
            <div className="lp-paths-card-top">
              <span className="lp-paths-skel-block lp-paths-skel-status" />
              <span className="lp-paths-skel-block lp-paths-skel-steps" />
            </div>
            <div className="lp-paths-progress">
              <div className="lp-paths-progress-meta">
                <span className="lp-paths-skel-block" style={{ width: "3rem", height: "0.85rem" }} />
                <span className="lp-paths-skel-block" style={{ width: "4rem", height: "0.7rem" }} />
              </div>
              <span className="lp-paths-skel-block lp-paths-skel-bar" />
            </div>
            <span className="lp-paths-skel-block lp-paths-skel-name" />
            <span className="lp-paths-skel-block lp-paths-skel-copy" />
            <span className="lp-paths-skel-block lp-paths-skel-copy lp-paths-skel-copy--short" />
            <div className="lp-paths-card-actions">
              <span className="lp-paths-skel-block lp-paths-skel-btn" />
              <span className="lp-paths-skel-block lp-paths-skel-link" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function PathStudioCard({ path }: { path: PathListItem }) {
  const href = path.nextSlug
    ? `${routes.exercise(path.nextSlug)}?path=${encodeURIComponent(path.slug)}`
    : routes.path(path.slug);
  const progress =
    path.stepCount > 0 ? Math.round((path.passedCount / path.stepCount) * 100) : 0;
  const status = statusOf(path);

  return (
    <article className={`lp-paths-card${path.complete ? " is-complete" : ""}`}>
      <div className="lp-paths-card-top">
        <span className={`lp-paths-status lp-paths-status--${status}`}>
          {statusLabel(path)}
        </span>
        <span className="lp-paths-steps">
          {path.passedCount}/{path.stepCount} steps
        </span>
      </div>

      <div className="lp-paths-progress">
        <div className="lp-paths-progress-meta">
          <strong>{progress}%</strong>
          <span>{path.complete ? "Path complete" : "Progress"}</span>
        </div>
        <div className="lp-paths-bar" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div>
        <h2 className="lp-paths-card-title">{path.title}</h2>
        <p className="lp-paths-card-copy">{path.intent}</p>
      </div>

      <div className="lp-paths-card-actions">
        <Link
          href={href}
          className={`lp-paths-btn${path.complete ? " lp-paths-btn--ghost" : ""}`}
        >
          {actionLabel(path)}
        </Link>
        <Link href={routes.path(path.slug)} className="lp-paths-link">
          View steps
        </Link>
      </div>
    </article>
  );
}

export function PathsView() {
  const [items, setItems] = useState<PathListItem[] | null>(null);
  const [error, setError] = useState<"load" | null>(null);
  const [filter, setFilter] = useState<FilterId>("all");

  useEffect(() => {
    let cancelled = false;
    pathsApi
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
        if (caught instanceof ApiError && caught.status === 401) {
          setItems([]);
          return;
        }
        setError("load");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    if (!items) {
      return [];
    }
    if (filter === "all") {
      return items;
    }
    return items.filter((path) => statusOf(path) === filter);
  }, [filter, items]);

  const counts = useMemo(() => {
    const base = { all: 0, active: 0, new: 0, done: 0 };
    if (!items) {
      return base;
    }
    base.all = items.length;
    for (const path of items) {
      base[statusOf(path)] += 1;
    }
    return base;
  }, [items]);

  if (error === "load") {
    return (
      <div className="lp-paths">
        <header className="lp-paths-hero">
          <div>
            <h1 className="lp-paths-title">Paths</h1>
            <p className="lp-paths-lead">
              Ordered exercise sequences. No lessons — just the next solve.
            </p>
          </div>
        </header>
        <div className="lp-paths-error">
          <strong>Could not load paths</strong>
          <p>Check that the API is running, then refresh this page.</p>
        </div>
      </div>
    );
  }

  if (!items) {
    return <PathsSkeleton />;
  }

  return (
    <div className="lp-paths">
      <header className="lp-paths-hero">
        <div>
          <h1 className="lp-paths-title">Paths</h1>
          <p className="lp-paths-lead">
            Ordered exercise sequences. No lessons. Start a path, solve the next
            open step, and stay inside your weekly quota.
          </p>
        </div>
        <div className="lp-paths-meta">
          <span className="lp-paths-chip lp-paths-chip--brand">
            {items.length} paths
          </span>
          <span className="lp-paths-chip">One exercise at a time</span>
        </div>
      </header>

      {items.length > 0 ? (
        <div className="lp-paths-filters" role="tablist" aria-label="Filter paths">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              className={`lp-paths-filter${filter === item.id ? " is-active" : ""}`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
              {counts[item.id] > 0 ? ` · ${counts[item.id]}` : ""}
            </button>
          ))}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="lp-paths-empty">
          <strong>No paths published yet</strong>
          <p>Guided paths will show up here when they are available.</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="lp-paths-empty">
          <strong>No paths in this filter</strong>
          <p>Try another status, or switch back to All.</p>
        </div>
      ) : (
        <section className="lp-paths-grid" aria-label="Guided paths">
          {visible.map((path) => (
            <PathStudioCard key={path.slug} path={path} />
          ))}
        </section>
      )}
    </div>
  );
}
