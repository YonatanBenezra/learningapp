"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api-client";
import type { LeaderboardResponse } from "@/types/leaderboard";
import { leaderboardApi } from "../leaderboard-api";
import "../leaderboard.css";

const PAGE_SIZE = 15;

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

function LeaderboardSkeleton() {
  return (
    <div className="lp-lb lp-lb-skel" aria-busy="true" aria-live="polite">
      <header className="lp-lb-hero">
        <div>
          <span className="lp-lb-skel-block lp-lb-skel-title" />
          <span className="lp-lb-skel-block lp-lb-skel-lead" />
          <span className="lp-lb-skel-block lp-lb-skel-lead lp-lb-skel-lead--short" />
        </div>
        <div className="lp-lb-meta">
          <span className="lp-lb-skel-block lp-lb-skel-chip" />
          <span className="lp-lb-skel-block lp-lb-skel-rule" />
        </div>
      </header>

      <section className="lp-lb-podium" aria-hidden="true">
        {[1, 2, 3].map((rank) => (
          <div key={rank} className={`lp-lb-podium-card lp-lb-podium-card--${rank}`}>
            <span className="lp-lb-skel-block lp-lb-skel-rank" />
            <span className="lp-lb-skel-block lp-lb-skel-name" />
            <span className="lp-lb-skel-block lp-lb-skel-slug" />
            <div className="lp-lb-podium-stats">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="lp-lb-podium-stat">
                  <span className="lp-lb-skel-block lp-lb-skel-stat-value" />
                  <span className="lp-lb-skel-block lp-lb-skel-stat-label" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="lp-lb-board" aria-hidden="true">
        <div className="lp-lb-board-head">
          <span>Rank</span>
          <span>Learner</span>
          <span>Solves</span>
          <span>Recent</span>
          <span>Rating</span>
        </div>
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className="lp-lb-row lp-lb-row--skel">
            <span className="lp-lb-skel-block lp-lb-skel-rank" />
            <div className="lp-lb-learner">
              <span className="lp-lb-skel-block lp-lb-skel-avatar" />
              <div className="lp-lb-learner-copy">
                <span className="lp-lb-skel-block lp-lb-skel-name" />
                <span className="lp-lb-skel-block lp-lb-skel-slug" />
              </div>
            </div>
            <span className="lp-lb-skel-block lp-lb-skel-metric" />
            <span className="lp-lb-skel-block lp-lb-skel-metric" />
            <span className="lp-lb-skel-block lp-lb-skel-metric" />
          </div>
        ))}
      </section>
    </div>
  );
}

export function LeaderboardView() {
  const [board, setBoard] = useState<LeaderboardResponse | null>(null);
  const [error, setError] = useState<"load" | null>(null);
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

  const pageCount = Math.max(1, Math.ceil((board?.items.length ?? 0) / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = useMemo(() => {
    if (!board) {
      return [];
    }
    const start = (currentPage - 1) * PAGE_SIZE;
    return board.items.slice(start, start + PAGE_SIZE);
  }, [board, currentPage]);

  const podium = currentPage === 1 ? pageItems.slice(0, 3) : [];
  const rows = currentPage === 1 ? pageItems.slice(3) : pageItems;
  const rangeStart =
    (board?.items.length ?? 0) === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, board?.items.length ?? 0);

  const setPageAndScroll = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (error === "load") {
    return (
      <div className="lp-lb">
        <header className="lp-lb-hero">
          <div>
            <h1 className="lp-lb-title">Leaderboard</h1>
            <p className="lp-lb-lead">
              Individual ranking for published Pro profiles. Free can view.
            </p>
          </div>
        </header>
        <div className="lp-lb-error">
          <strong>Could not load the leaderboard</strong>
          <p>Check that the API is running, then refresh this page.</p>
        </div>
      </div>
    );
  }

  if (!board) {
    return <LeaderboardSkeleton />;
  }

  return (
    <div className="lp-lb">
      <header className="lp-lb-hero">
        <div>
          <h1 className="lp-lb-title">Leaderboard</h1>
          <p className="lp-lb-lead">
            Individual ranking for published Pro profiles. Free can view. Opt out
            from Progress and you leave the board.
          </p>
        </div>
        <div className="lp-lb-meta">
          <span className="lp-lb-chip lp-lb-chip--brand">
            {board.items.length} ranked
          </span>
          {board.items.length > 0 ? (
            <span className="lp-lb-chip">
              Showing {rangeStart}–{rangeEnd}
            </span>
          ) : null}
          <p className="lp-lb-rule">{board.rule}</p>
        </div>
      </header>

      {board.items.length === 0 ? (
        <div className="lp-lb-empty">
          <strong>No published profiles yet</strong>
          <p>When Pro learners publish their profile, they appear here.</p>
        </div>
      ) : (
        <>
          {podium.length > 0 ? (
            <section className="lp-lb-podium" aria-label="Top ranked">
              {podium.map((row) => (
                <Link
                  key={row.slug}
                  href={routes.profile(row.slug)}
                  className={`lp-lb-podium-card lp-lb-podium-card--${row.rank}`}
                >
                  <span className="lp-lb-podium-rank">#{row.rank}</span>
                  <h2 className="lp-lb-podium-name">{row.displayName}</h2>
                  <p className="lp-lb-podium-slug">/{row.slug}</p>
                  <div className="lp-lb-podium-stats">
                    <div className="lp-lb-podium-stat">
                      <strong>{row.rating}</strong>
                      <span>Rating</span>
                    </div>
                    <div className="lp-lb-podium-stat">
                      <strong>{row.solves}</strong>
                      <span>Solves</span>
                    </div>
                    <div className="lp-lb-podium-stat">
                      <strong>{row.recentPasses}</strong>
                      <span>Recent</span>
                    </div>
                  </div>
                </Link>
              ))}
            </section>
          ) : null}

          {rows.length > 0 ? (
            <section className="lp-lb-board" aria-label="Rankings">
              <div className="lp-lb-board-head" aria-hidden="true">
                <span>Rank</span>
                <span>Learner</span>
                <span>Solves</span>
                <span>Recent</span>
                <span>Rating</span>
              </div>
              {rows.map((row) => (
                <Link
                  key={row.slug}
                  href={routes.profile(row.slug)}
                  className="lp-lb-row"
                >
                  <span className="lp-lb-rank">{row.rank}</span>
                  <div className="lp-lb-learner">
                    <span className="lp-lb-avatar" aria-hidden="true">
                      {initials(row.displayName)}
                    </span>
                    <div className="lp-lb-learner-copy">
                      <p className="lp-lb-learner-name">{row.displayName}</p>
                      <p className="lp-lb-learner-slug">/{row.slug}</p>
                    </div>
                  </div>
                  <span className="lp-lb-metric" data-label="Solves">
                    {row.solves}
                  </span>
                  <span className="lp-lb-metric" data-label="Recent">
                    {row.recentPasses}
                  </span>
                  <span className="lp-lb-metric lp-lb-metric--rating" data-label="Rating">
                    {row.rating}
                  </span>
                </Link>
              ))}
            </section>
          ) : null}

          {pageCount > 1 ? (
            <nav className="lp-lb-pager" aria-label="Leaderboard pages">
              <button
                type="button"
                className="lp-lb-page"
                disabled={currentPage <= 1}
                aria-label="Previous page"
                onClick={() => setPageAndScroll(Math.max(1, currentPage - 1))}
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
                  <span key={`e-${index}`} className="lp-lb-page-ellipsis" aria-hidden="true">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    className={`lp-lb-page${item === currentPage ? " is-active" : ""}`}
                    aria-label={`Page ${item}`}
                    aria-current={item === currentPage ? "page" : undefined}
                    onClick={() => setPageAndScroll(item)}
                  >
                    {item}
                  </button>
                ),
              )}

              <button
                type="button"
                className="lp-lb-page"
                disabled={currentPage >= pageCount}
                aria-label="Next page"
                onClick={() => setPageAndScroll(Math.min(pageCount, currentPage + 1))}
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
    </div>
  );
}
