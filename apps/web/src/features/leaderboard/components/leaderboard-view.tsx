"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api-client";
import type { LeaderboardResponse } from "@/types/leaderboard";
import { leaderboardApi } from "../leaderboard-api";

export function LeaderboardView() {
  const [board, setBoard] = useState<LeaderboardResponse | null>(null);
  const [error, setError] = useState<"load" | null>(null);

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

  if (error === "load") {
    return <p className="lp-pg-note">Could not load the leaderboard.</p>;
  }

  if (!board) {
    return <p className="lp-pg-note">Loading…</p>;
  }

  return (
    <>
      <p className="lp-cat-lead">{board.rule}</p>
      {board.items.length === 0 ? (
        <p className="lp-pg-note">No published profiles yet.</p>
      ) : (
        <div className="lp-pg-table-wrap">
          <table className="lp-pg-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Learner</th>
                <th>Solves</th>
                <th>Recent passes</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {board.items.map((row) => (
                <tr key={row.slug}>
                  <td>{row.rank}</td>
                  <td>
                    <Link href={routes.profile(row.slug)} className="lp-link">
                      {row.displayName}
                    </Link>
                  </td>
                  <td>{row.solves}</td>
                  <td>{row.recentPasses}</td>
                  <td>{row.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
