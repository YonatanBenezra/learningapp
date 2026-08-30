"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { pricing } from "@/config/pricing";
import { authApi } from "@/features/auth/auth-api";
import { billingApi } from "@/features/billing/billing-api";
import type { User } from "@/types/user";
import "@/features/progress/progress.css";

export function BillingPage() {
  return (
    <Suspense fallback={<p className="lp-page lp-pg-note">Loading billing…</p>}>
      <BillingFields />
    </Suspense>
  );
}

function BillingFields() {
  const search = useSearchParams();
  const status = search.get("status");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"monthly" | "annual" | "portal" | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((result) => {
        if (!cancelled) {
          setUser(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load account.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pro = user?.account?.tier === "pro";

  async function startCheckout(interval: "monthly" | "annual") {
    setPending(interval);
    setError(null);
    try {
      const session = await billingApi.checkout(interval);
      window.location.assign(session.url);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Checkout failed");
      setPending(null);
    }
  }

  async function openPortal() {
    setPending("portal");
    setError(null);
    try {
      const session = await billingApi.portal();
      window.location.assign(session.url);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Portal failed");
      setPending(null);
    }
  }

  return (
    <div className="lp-page lp-page-progress">
      <header className="lp-cat-header">
        <h1 className="lp-cat-title">Billing</h1>
        <p className="lp-cat-lead">
          Free is {pricing.freeExercisesPerWeek} graded exercises a week. Pro is
          €{pricing.proMonthlyEur}/mo or €{pricing.proAnnualEur}/yr.
        </p>
      </header>

      {status === "success" ? (
        <p className="lp-pg-note">Checkout finished. Your plan updates in a moment.</p>
      ) : null}
      {status === "cancel" ? (
        <p className="lp-pg-note">Checkout canceled. You are still on Free.</p>
      ) : null}

      <section className="lp-panel lp-pg-panel">
        <div className="lp-pg-panel-top">
          <div>
            <p className="lp-panel-eyebrow">Plan</p>
            <h2 className="lp-panel-title">
              {pro ? "LabPath Pro" : "LabPath Free"}
            </h2>
          </div>
        </div>
        {user?.account ? (
          <div className="lp-pg-table-wrap">
            <table className="lp-pg-table">
              <tbody>
                <tr>
                  <th>Tier</th>
                  <td>{user.account.tier}</td>
                </tr>
                <tr>
                  <th>Status</th>
                  <td>{user.account.subscriptionStatus}</td>
                </tr>
                <tr>
                  <th>Attempts this period</th>
                  <td>{user.account.attemptsThisPeriod}</td>
                </tr>
                <tr>
                  <th>Remaining</th>
                  <td>
                    {user.account.attemptsRemaining} /{" "}
                    {user.account.limits.attemptsPerPeriod}
                    {user.account.limits.periodKind === "calendar_week"
                      ? " this week"
                      : " this month"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="lp-pg-note">{error ?? "Loading…"}</p>
        )}
        <div className="lp-pg-actions">
          {!pro ? (
            <>
              <button
                type="button"
                className="lp-btn lp-btn-primary"
                disabled={pending !== null}
                onClick={() => void startCheckout("monthly")}
              >
                {pending === "monthly" ? "Redirecting…" : `Pro monthly · €${pricing.proMonthlyEur}`}
              </button>
              <button
                type="button"
                className="lp-btn lp-btn-ghost"
                disabled={pending !== null}
                onClick={() => void startCheckout("annual")}
              >
                {pending === "annual" ? "Redirecting…" : `Pro annual · €${pricing.proAnnualEur}`}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="lp-btn lp-btn-ghost"
              disabled={pending !== null}
              onClick={() => void openPortal()}
            >
              {pending === "portal" ? "Redirecting…" : "Manage subscription"}
            </button>
          )}
        </div>
        {error && user ? <p className="lp-pg-note lp-pg-actions">{error}</p> : null}
      </section>
    </div>
  );
}
