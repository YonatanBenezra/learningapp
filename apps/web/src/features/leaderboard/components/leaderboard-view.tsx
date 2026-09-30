"use client";

import { Search, Target, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api-client";
import type { LeaderboardEntry, LeaderboardResponse } from "@/types/leaderboard";
import { leaderboardApi } from "../leaderboard-api";
import "../leaderboard.css";

const PAGE_SIZE = 20;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function formatNum(n: number) {
  return n.toLocaleString("en-US");
}

function LeaderboardSkeleton() {
  return (
    <div className="lp-lb2 lp-lb2--loading" aria-busy="true" aria-live="polite">
      <div className="lp-lb2-skel lp-lb2-skel-title" />
      <div className="lp-lb2-stats">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="lp-lb2-stat lp-lb2-stat--skel" />
        ))}
      </div>
      <div className="lp-lb2-podium">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="lp-lb2-podium-card lp-lb2-podium-card--skel" />
        ))}
      </div>
      <div className="lp-lb2-panel lp-lb2-panel--skel" />
    </div>
  );
}

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: typeof Users;
  tone: "brand" | "violet" | "amber";
  label: string;
  value: string;
}) {
  return (
    <div className="lp-lb2-stat">
      <div className={`lp-lb2-stat-icon lp-lb2-stat-icon--${tone}`} aria-hidden>
        <Icon className="size-[1.125rem]" strokeWidth={2} />
      </div>
      <div className="lp-lb2-stat-copy">
        <p className="lp-lb2-stat-label">{label}</p>
        <p className="lp-lb2-stat-value">{value}</p>
      </div>
    </div>
  );
}

function PodiumCard({ row }: { row: LeaderboardEntry }) {
  const tier =
    row.rank === 1 ? "gold" : row.rank === 2 ? "silver" : row.rank === 3 ? "bronze" : "default";

  return (
    <Link
      href={routes.profile(row.slug)}
      className={`lp-lb2-podium-card lp-lb2-podium-card--${tier}`}
    >
      <div className="lp-lb2-podium-head">
        <span className={`lp-lb2-podium-avatar lp-lb2-podium-avatar--${tier}`}>
          {initials(row.displayName)}
          <span className="lp-lb2-podium-rank-badge">{row.rank}</span>
        </span>
        <div className="lp-lb2-podium-identity">
          <p className="lp-lb2-podium-name">{row.displayName}</p>
          <p className="lp-lb2-podium-handle">@{row.slug}</p>
        </div>
      </div>

      {row.rank === 1 ? (
        <div className="lp-lb2-podium-medal" aria-hidden>
          <Trophy className="size-10 text-[#d4af37]" strokeWidth={1.75} />
        </div>
      ) : null}

      <dl className="lp-lb2-podium-metrics">
        <div>
          <dt>Solves</dt>
          <dd>{formatNum(row.solves)}</dd>
        </div>
        <div>
          <dt>Recent</dt>
          <dd>{formatNum(row.recentPasses)}</dd>
        </div>
        <div>
          <dt>Rating</dt>
          <dd>{formatNum(row.rating)}</dd>
        </div>
      </dl>
    </Link>
  );
}

function GlobalRow({ row }: { row: LeaderboardEntry }) {
  return (
    <Link href={routes.profile(row.slug)} className="lp-lb2-global-row">
      <span className="lp-lb2-global-rank">{row.rank}</span>
      <span className="lp-lb2-global-user">
        <span className="lp-lb2-global-avatar">{initials(row.displayName)}</span>
        <span className="lp-lb2-global-user-text">
          <span className="lp-lb2-global-name">{row.displayName}</span>
          <span className="lp-lb2-global-id">@{row.slug}</span>
        </span>
      </span>
      <span className="lp-lb2-global-cell">{formatNum(row.solves)}</span>
      <span className="lp-lb2-global-cell">{formatNum(row.recentPasses)}</span>
      <span className="lp-lb2-global-cell lp-lb2-global-cell--accent">
        {formatNum(row.rating)}
      </span>
    </Link>
  );
}

export function LeaderboardView() {
  const [board, setBoard] = useState<LeaderboardResponse | null>(null);
  const [error, setError] = useState<"load" | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    leaderboardApi
      .list()
      .then((result) => {
        if (!cancelled) {
          setBoard(result);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled && !(caught instanceof ApiError && caught.status === 401)) {
          setError("load");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!board) {
      return [];
    }
    const q = query.trim().toLowerCase();
    if (!q) {
      return board.items;
    }
    return board.items.filter(
      (row) =>
        row.displayName.toLowerCase().includes(q) ||
        row.slug.toLowerCase().includes(q),
    );
  }, [board, query]);

  const aggregates = useMemo(() => {
    const items = board?.items ?? [];
    return {
      ranked: items.length,
      solves: items.reduce((sum, row) => sum + row.solves, 0),
      recent: items.reduce((sum, row) => sum + row.recentPasses, 0),
    };
  }, [board]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const searching = Boolean(query.trim());
  const podium = searching ? [] : (board?.items.slice(0, 3) ?? []);

  const globalSource = useMemo(() => {
    if (searching) {
      return filtered;
    }
    return filtered.filter((row) => row.rank > 3);
  }, [filtered, searching]);

  const pageCount = Math.max(1, Math.ceil(globalSource.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const globalRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return globalSource.slice(start, start + PAGE_SIZE);
  }, [globalSource, currentPage]);

  if (error === "load") {
    return (
      <div className="lp-lb2">
        <h1 className="lp-lb2-page-title">Leaderboard</h1>
        <div className="lp-lb2-empty lp-lb2-empty--error">
          <strong>Could not load rankings</strong>
          <p>Check that the API is running, then refresh.</p>
        </div>
      </div>
    );
  }

  if (!board) {
    return <LeaderboardSkeleton />;
  }

  return (
    <div className="lp-lb2">
      <h1 className="lp-lb2-page-title">Leaderboard</h1>

      <div className="lp-lb2-stats">
        <StatCard
          icon={Users}
          tone="brand"
          label="Published profiles"
          value={formatNum(aggregates.ranked)}
        />
        <StatCard
          icon={Target}
          tone="violet"
          label="Passes (30 days)"
          value={formatNum(aggregates.recent)}
        />
        <div className="lp-lb2-stat lp-lb2-stat--wide">
          <div className="lp-lb2-stat-icon lp-lb2-stat-icon--amber" aria-hidden>
            <Trophy className="size-[1.125rem]" strokeWidth={2} />
          </div>
          <div className="lp-lb2-stat-copy">
            <p className="lp-lb2-stat-label">How ranking works</p>
            <p className="lp-lb2-stat-note">{board.rule}</p>
          </div>
        </div>
      </div>

      {podium.length > 0 ? (
        <section className="lp-lb2-podium" aria-label="Top performers">
          {podium.map((row) => (
            <PodiumCard key={row.slug} row={row} />
          ))}
        </section>
      ) : null}

      <section className="lp-lb2-panel">
        <div className="lp-lb2-panel-head">
          <h2 className="lp-lb2-panel-title">Global ranking</h2>
          <label className="lp-lb2-search">
            <Search className="size-4 shrink-0 opacity-55" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search learner…"
              aria-label="Search leaderboard"
            />
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className="lp-lb2-empty">
            <strong>{board.items.length === 0 ? "No one on the board yet" : "No matches"}</strong>
            <p>
              {board.items.length === 0
                ? "Publish your Pro profile from Dashboard after your first pass."
                : "Try a different search term."}
            </p>
            {board.items.length === 0 ? (
              <Link href={routes.dashboard} className="lp-lb2-cta">
                Open Dashboard
              </Link>
            ) : null}
          </div>
        ) : globalRows.length === 0 && !searching ? (
          <p className="lp-lb2-panel-hint">Top three are shown above. More ranks appear as learners publish.</p>
        ) : (
          <>
            <div className="lp-lb2-global" role="table" aria-label="Global ranking">
              <div className="lp-lb2-global-head" role="row">
                <span role="columnheader">Rank</span>
                <span role="columnheader">User name</span>
                <span role="columnheader">Solves</span>
                <span role="columnheader">Recent (30d)</span>
                <span role="columnheader">Rating</span>
              </div>
              {globalRows.map((row) => (
                <GlobalRow key={row.slug} row={row} />
              ))}
            </div>

            {pageCount > 1 ? (
              <nav className="lp-lb2-pager" aria-label="Pages">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span>
                  Page {currentPage} of {pageCount}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                >
                  Next
                </button>
              </nav>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
