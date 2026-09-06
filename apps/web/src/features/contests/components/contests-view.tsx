"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api-client";
import type { ContestListItem, ContestWindow } from "@/types/contest";
import { contestsApi } from "../contests-api";
import "../contests.css";

type FilterId = "all" | ContestWindow | "entered";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "upcoming", label: "Upcoming" },
  { id: "closed", label: "Closed" },
  { id: "entered", label: "Entered" },
];

function windowLabel(window: ContestWindow) {
  if (window === "open") {
    return "Open";
  }
  if (window === "upcoming") {
    return "Upcoming";
  }
  return "Closed";
}

function actionLabel(contest: ContestListItem) {
  if (contest.canEnter) {
    return "Enter";
  }
  if (contest.entered && contest.window === "open") {
    return "Continue";
  }
  return "View";
}

function formatWindowRange(contest: ContestListItem) {
  const starts = new Date(contest.startsAt);
  const ends = new Date(contest.endsAt);
  if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime())) {
    return "Schedule TBA";
  }
  const fmt = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  });
  return `${fmt.format(starts)} – ${fmt.format(ends)}`;
}

function ContestsSkeleton() {
  return (
    <div className="lp-ct lp-ct-skel" aria-busy="true" aria-live="polite">
      <header className="lp-ct-hero">
        <div>
          <span className="lp-ct-skel-block lp-ct-skel-title" />
          <span className="lp-ct-skel-block lp-ct-skel-lead" />
          <span className="lp-ct-skel-block lp-ct-skel-lead lp-ct-skel-lead--short" />
        </div>
        <div className="lp-ct-meta">
          <span className="lp-ct-skel-block lp-ct-skel-chip" />
          <span className="lp-ct-skel-block lp-ct-skel-chip" />
        </div>
      </header>

      <div className="lp-ct-filters">
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index} className="lp-ct-skel-block lp-ct-skel-filter" />
        ))}
      </div>

      <div className="lp-ct-grid">
        {Array.from({ length: 3 }, (_, index) => (
          <article key={index} className="lp-ct-card">
            <div className="lp-ct-card-top">
              <span className="lp-ct-skel-block lp-ct-skel-badge" />
              <span className="lp-ct-skel-block lp-ct-skel-badge" />
            </div>
            <span className="lp-ct-skel-block lp-ct-skel-name" />
            <span className="lp-ct-skel-block lp-ct-skel-copy" />
            <span className="lp-ct-skel-block lp-ct-skel-copy lp-ct-skel-copy--short" />
            <div className="lp-ct-card-facts">
              <span className="lp-ct-skel-block lp-ct-skel-fact" />
              <span className="lp-ct-skel-block lp-ct-skel-fact" />
            </div>
            <div className="lp-ct-card-actions">
              <span className="lp-ct-skel-block lp-ct-skel-btn" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ContestStudioCard({ contest }: { contest: ContestListItem }) {
  const href = routes.contest(contest.slug);
  const primary = contest.canEnter || (contest.entered && contest.window === "open");

  return (
    <article
      className={`lp-ct-card${contest.window === "open" ? " is-open" : ""}`}
    >
      <div className="lp-ct-card-top">
        <span className="lp-ct-badge">Contest</span>
        <span className={`lp-ct-badge lp-ct-badge--${contest.window}`}>
          {windowLabel(contest.window)}
        </span>
        {contest.entered ? (
          <span className="lp-ct-badge lp-ct-badge--entered">Entered</span>
        ) : null}
      </div>

      <div>
        <h2 className="lp-ct-card-title">{contest.title}</h2>
        <p className="lp-ct-card-copy">{contest.intent}</p>
      </div>

      <div className="lp-ct-card-facts">
        <div className="lp-ct-fact">
          <strong>{contest.timeBoxMinutes} min</strong>
          <span>Time box</span>
        </div>
        <div className="lp-ct-fact">
          <strong>Pool {contest.problemCount}</strong>
          <span>Problems</span>
        </div>
      </div>

      <div className="lp-ct-card-actions">
        <Link
          href={href}
          className={`lp-ct-btn${primary ? "" : " lp-ct-btn--ghost"}`}
        >
          {actionLabel(contest)}
        </Link>
        <span className="lp-ct-chip">{formatWindowRange(contest)}</span>
      </div>
    </article>
  );
}

export function ContestsView() {
  const [items, setItems] = useState<ContestListItem[] | null>(null);
  const [error, setError] = useState<"load" | null>(null);
  const [filter, setFilter] = useState<FilterId>("all");

  useEffect(() => {
    let cancelled = false;
    contestsApi
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
    if (filter === "entered") {
      return items.filter((contest) => contest.entered);
    }
    return items.filter((contest) => contest.window === filter);
  }, [filter, items]);

  const counts = useMemo(() => {
    const base = {
      all: 0,
      open: 0,
      upcoming: 0,
      closed: 0,
      entered: 0,
    };
    if (!items) {
      return base;
    }
    base.all = items.length;
    for (const contest of items) {
      base[contest.window] += 1;
      if (contest.entered) {
        base.entered += 1;
      }
    }
    return base;
  }, [items]);

  if (error === "load") {
    return (
      <div className="lp-ct">
        <header className="lp-ct-hero">
          <div>
            <h1 className="lp-ct-title">Contests</h1>
            <p className="lp-ct-lead">
              Timed, ranked seasons with novel problems. Pro only.
            </p>
          </div>
        </header>
        <div className="lp-ct-error">
          <strong>Could not load contests</strong>
          <p>Check that the API is running, then refresh this page.</p>
        </div>
      </div>
    );
  }

  if (!items) {
    return <ContestsSkeleton />;
  }

  return (
    <div className="lp-ct">
      <header className="lp-ct-hero">
        <div>
          <h1 className="lp-ct-title">Contests</h1>
          <p className="lp-ct-lead">
            Timed, ranked seasons with novel problems sampled from a hidden pool.
            Pro only. Hints are off during contest attempts.
          </p>
        </div>
        <div className="lp-ct-meta">
          <span className="lp-ct-chip lp-ct-chip--brand">
            {items.length} contests
          </span>
          <span className="lp-ct-chip">Pro only · hints off</span>
        </div>
      </header>

      {items.length > 0 ? (
        <div className="lp-ct-filters" role="tablist" aria-label="Filter contests">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              className={`lp-ct-filter${filter === item.id ? " is-active" : ""}`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
              {counts[item.id] > 0 ? ` · ${counts[item.id]}` : ""}
            </button>
          ))}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="lp-ct-empty">
          <strong>No contests yet</strong>
          <p>When a season opens, it will show up here.</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="lp-ct-empty">
          <strong>No contests in this filter</strong>
          <p>Try another status, or switch back to All.</p>
        </div>
      ) : (
        <section className="lp-ct-grid" aria-label="Contests">
          {visible.map((contest) => (
            <ContestStudioCard key={contest.slug} contest={contest} />
          ))}
        </section>
      )}
    </div>
  );
}
