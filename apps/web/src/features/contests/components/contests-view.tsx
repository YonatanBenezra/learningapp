"use client";

import { Clock, ShieldCheck, Trophy, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { routes } from "@/config/routes";
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

function ContestsHighlights() {
  const items = [
    {
      icon: Trophy,
      label: "Ranked seasons",
      copy: "Fixed problem pools, live standings, and verify-ready results.",
    },
    {
      icon: Clock,
      label: "Time-boxed",
      copy: "One sitting per entry — hints off, clock on, same rules for everyone.",
    },
    {
      icon: ShieldCheck,
      label: "Fair grading",
      copy: "Hidden cases and automated graders — no manual review queue.",
    },
  ] as const;

  return (
    <div className="lp-ct-highlights" aria-label="How contests work">
      {items.map(({ icon: Icon, label, copy }) => (
        <article key={label} className="lp-ct-highlight">
          <span className="lp-ct-highlight-icon" aria-hidden>
            <Icon className="size-[1.125rem]" strokeWidth={2} />
          </span>
          <h2 className="lp-ct-highlight-title">{label}</h2>
          <p className="lp-ct-highlight-copy">{copy}</p>
        </article>
      ))}
    </div>
  );
}

function ContestsEmptyPanel() {
  return (
    <section className="lp-ct-panel lp-ct-panel--empty" aria-labelledby="ct-empty-title">
      <div className="lp-ct-panel-glow" aria-hidden />
      <span className="lp-ct-panel-icon" aria-hidden>
        <Zap className="size-7" strokeWidth={1.75} />
      </span>
      <p className="lp-ct-panel-kicker">Season 1</p>
      <h2 id="ct-empty-title" className="lp-ct-panel-title">
        No open contests yet
      </h2>
      <p className="lp-ct-panel-lead">
        We are finishing the rebuilt catalogue before the first timed Guardrails and RAG seasons
        go live. Practice on Problems now — your account will be ready when entries open.
      </p>
      <div className="lp-ct-panel-actions">
        <Link href={routes.problems} className="lp-ct-btn">
          Browse problems
        </Link>
        <Link href={routes.leaderboard} className="lp-ct-btn lp-ct-btn--ghost">
          View leaderboard
        </Link>
      </div>
    </section>
  );
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
              Timed, ranked seasons with novel problems.
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

  const catalogueEmpty = items.length === 0;

  return (
    <div className={`lp-ct${catalogueEmpty ? " lp-ct--idle" : ""}`}>
      <header className="lp-ct-hero">
        <div className="lp-ct-hero-copy">
          <p className="lp-ct-kicker">Timed seasons</p>
          <h1 className="lp-ct-title">Contests</h1>
          <p className="lp-ct-lead">
            {catalogueEmpty
              ? "Ranked, time-boxed sprints on live Guardrails and RAG problems — built for portfolios and hiring loops."
              : "Enter a season, solve your drawn pool before the clock stops, and climb the standings."}
          </p>
        </div>
        <div className="lp-ct-meta">
          <span className="lp-ct-chip lp-ct-chip--brand">
            {catalogueEmpty ? "Opening soon" : `${items.length} live`}
          </span>
          <span className="lp-ct-chip">Free tier · Hints off in contest</span>
        </div>
      </header>

      {catalogueEmpty ? <ContestsHighlights /> : null}

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

      {catalogueEmpty ? (
        <ContestsEmptyPanel />
      ) : visible.length === 0 ? (
        <div className="lp-ct-empty lp-ct-empty--inline">
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
