"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { routes } from "@/config/routes";
import { contestsApi } from "@/features/contests/contests-api";
import type { ContestLeaderboard, ContestWindow } from "@/types/contest";

function formatElapsed(ms: number | null): string {
  if (ms == null) {
    return "—";
  }
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

const STATUS_LABEL: Record<string, string> = {
  active: "In progress",
  finished: "Finished",
  expired: "Time expired",
};

type Props = {
  slug: string;
  seasonWindow: ContestWindow;
  exportCsv?: boolean;
};

export function ContestLeaderboardSection({
  slug,
  seasonWindow,
  exportCsv = false,
}: Props) {
  const [board, setBoard] = useState<ContestLeaderboard | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    try {
      const data = await contestsApi.leaderboard(slug, page, 50);
      setBoard(data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [slug, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (seasonWindow !== "open") {
      return;
    }
    const id = globalThis.setInterval(() => void load(), 60_000);
    return () => globalThis.clearInterval(id);
  }, [seasonWindow, load]);

  if (loading && !board) {
    return (
      <section className="lp-ctd-leaderboard" aria-label="Rankings" aria-busy="true">
        <div className="lp-ctd-section-head">
          <h2 className="lp-ctd-section-title">Rankings</h2>
        </div>
        <p className="lp-ctd-section-note">Loading standings…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="lp-ctd-leaderboard" aria-label="Rankings">
        <p className="lp-ctd-notice">Could not load rankings.</p>
      </section>
    );
  }

  if (!board) {
    return null;
  }

  return (
    <section className="lp-ctd-leaderboard" aria-label="Rankings">
      <div className="lp-ctd-section-head">
        <div>
          <h2 className="lp-ctd-section-title">Rankings</h2>
          <p className="lp-ctd-section-note">
            Score (high wins, max {board.contest.maxScore}) · tie-break by time ·{" "}
            {board.total} entrant
            {board.total === 1 ? "" : "s"}
            {seasonWindow === "open"
              ? " · refreshes every 60s"
              : seasonWindow === "closed"
                ? " · final standings"
                : ""}
          </p>
        </div>
        <div className="lp-ctd-lb-actions">
          <button type="button" className="lp-ct-btn lp-ct-btn--ghost" onClick={() => void load()}>
            Refresh
          </button>
          {exportCsv ? (
            <a
              href={contestsApi.leaderboardExportUrl(slug)}
              className="lp-ct-btn lp-ct-btn--ghost"
              download
            >
              Export CSV
            </a>
          ) : null}
        </div>
      </div>

      {board.items.length === 0 ? (
        <p className="lp-ctd-section-note">No entrants yet. Be the first to enter.</p>
      ) : (
        <div className="lp-ctd-lb-table-wrap">
          <table className="lp-ctd-lb-table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Participant</th>
                <th scope="col">Score</th>
                <th scope="col">Time</th>
                <th scope="col">Solved</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {board.items.map((row) => (
                <tr
                  key={`${row.rank}-${row.displayName}`}
                  className={row.isYou ? "is-you" : undefined}
                >
                  <td>{row.rank}</td>
                  <td>
                    {row.profileSlug ? (
                      <Link href={routes.profile(row.profileSlug)} className="lp-link">
                        {row.displayName}
                      </Link>
                    ) : (
                      row.displayName
                    )}
                    {row.isYou ? <span className="lp-ctd-lb-you"> You</span> : null}
                  </td>
                  <td>{row.totalScore}</td>
                  <td>{formatElapsed(row.elapsedMs)}</td>
                  <td>
                    {row.solvedCount}/{row.totalCount}
                  </td>
                  <td>{STATUS_LABEL[row.status] ?? row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {board && board.total > board.pageSize ? (
        <div className="lp-ctd-lb-pager">
          <button
            type="button"
            className="lp-ct-btn lp-ct-btn--ghost"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </button>
          <span className="lp-ctd-section-note">
            Page {board.page} of {Math.ceil(board.total / board.pageSize)}
          </span>
          <button
            type="button"
            className="lp-ct-btn lp-ct-btn--ghost"
            disabled={page * board.pageSize >= board.total}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}
