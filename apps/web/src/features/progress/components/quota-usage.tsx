"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { authApi } from "@/features/auth/auth-api";
import { ApiError } from "@/lib/api-client";
import type { User } from "@/types/user";

export function QuotaUsage() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<"auth" | "load" | null>(null);

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((result) => {
        if (!cancelled) {
          setUser(result);
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

  const account = user?.account;
  const period =
    account?.limits.periodKind === "rolling_30d" ? "this month" : "this week";

  return (
    <section className="lp-panel lp-pg-panel">
      <div className="lp-pg-panel-top">
        <div>
          <p className="lp-panel-eyebrow">Plan</p>
          <h2 className="lp-panel-title">Quota</h2>
        </div>
      </div>
      {error === "auth" ? (
        <p className="lp-pg-note">
          Sign in to view quota.{" "}
          <Link
            href={`${routes.login}?next=${encodeURIComponent(routes.progress)}`}
            className="lp-link"
          >
            Sign in
          </Link>
        </p>
      ) : null}
      {error === "load" ? (
        <p className="lp-pg-note">Could not load quota.</p>
      ) : null}
      {account ? (
        <>
          <div className="lp-pg-stats">
            <div className="lp-pg-stat">
              <span className="lp-pg-stat-value">{account.tier}</span>
              <span className="lp-pg-stat-label">tier</span>
            </div>
            <div className="lp-pg-stat">
              <span className="lp-pg-stat-value">
                {account.attemptsRemaining}
              </span>
              <span className="lp-pg-stat-label">left {period}</span>
            </div>
            <div className="lp-pg-stat">
              <span className="lp-pg-stat-value">
                {account.attemptsThisPeriod}/{account.limits.attemptsPerPeriod}
              </span>
              <span className="lp-pg-stat-label">used {period}</span>
            </div>
          </div>
          {account.quotaExceeded ? (
            <p className="lp-pg-note">
              You are at the {account.tier === "pro" ? "fair-use" : "free"} cap.{" "}
              <Link href={routes.billing} className="lp-link">
                {account.tier === "pro" ? "Manage billing" : "Upgrade to Pro"}
              </Link>
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
