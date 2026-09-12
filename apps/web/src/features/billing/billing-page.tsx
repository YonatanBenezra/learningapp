"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { GlobalLoader } from "@/components/ui/global-loader";
import { pricing } from "@/config/pricing";
import { authApi } from "@/features/auth/auth-api";
import { billingApi } from "@/features/billing/billing-api";
import type { User } from "@/types/user";
import "./billing.css";

export function BillingPage() {
  return (
    <Suspense fallback={<GlobalLoader contained />}>
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
  const account = user?.account;
  const period =
    account?.limits.periodKind === "rolling_30d" ? "this month" : "this week";

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

  if (!user && !error) {
    return <GlobalLoader contained />;
  }

  return (
    <div className="lp-page lp-page-progress">
      <div className="lp-bill">
        <header className="lp-bill-hero">
          <div>
            <h1 className="lp-bill-title">Billing</h1>
            <p className="lp-bill-lead">
              Free is {pricing.freeExercisesPerWeek} graded exercises a week. Pro is
              €{pricing.proMonthlyEur}/mo or €{pricing.proAnnualEur}/yr with higher
              fair-use limits.
            </p>
          </div>
          {account ? (
            <div className="lp-bill-meta">
              <span className="lp-bill-chip lp-bill-chip--brand">
                {account.tier} plan
              </span>
              <span className="lp-bill-chip">{account.subscriptionStatus}</span>
            </div>
          ) : null}
        </header>

        {status === "success" ? (
          <p className="lp-bill-banner lp-bill-banner--ok">
            Checkout finished. Your plan updates in a moment.
          </p>
        ) : null}
        {status === "cancel" ? (
          <p className="lp-bill-banner">
            Checkout canceled. You are still on Free.
          </p>
        ) : null}

        {!user && error ? (
          <p className="lp-bill-banner">{error}</p>
        ) : null}

        <section className="lp-bill-grid" aria-label="Plans">
          <article className={`lp-bill-card${!pro ? " is-current" : ""}`}>
            <div className="lp-bill-card-top">
              <h2 className="lp-bill-plan">LabPath Free</h2>
              {!pro ? <span className="lp-bill-badge">Current</span> : null}
            </div>
            <div>
              <p className="lp-bill-price">
                €0<span>/mo</span>
              </p>
              <p className="lp-bill-price-note">
                {pricing.freeExercisesPerWeek} graded exercises / week
              </p>
            </div>
            <ul className="lp-bill-features">
              <li>Catalogue access and guided paths</li>
              <li>Scorecards on every graded attempt</li>
              <li>Public profile optional</li>
            </ul>
            <div className="lp-bill-actions">
              {!pro ? (
                <button type="button" className="lp-bill-btn lp-bill-btn--ghost" disabled>
                  Current plan
                </button>
              ) : (
                <p className="lp-bill-empty">Included as fallback after Pro ends.</p>
              )}
            </div>
          </article>

          <article className={`lp-bill-card lp-bill-card--pro${pro ? " is-current" : ""}`}>
            <div className="lp-bill-card-top">
              <h2 className="lp-bill-plan">LabPath Pro</h2>
              {pro ? <span className="lp-bill-badge">Current</span> : null}
            </div>
            <div>
              <p className="lp-bill-price">
                €{pricing.proMonthlyEur}
                <span>/mo</span>
              </p>
              <p className="lp-bill-price-note">
                or €{pricing.proAnnualEur}/yr · up to{" "}
                {pricing.proFairUseAttemptsMonthly} attempts / month
              </p>
            </div>
            <ul className="lp-bill-features">
              <li>Higher fair-use attempt quota</li>
              <li>Contests and leaderboard eligibility</li>
              <li>Publish a public profile</li>
            </ul>
            <div className="lp-bill-actions">
              {!pro ? (
                <>
                  <button
                    type="button"
                    className="lp-bill-btn"
                    disabled={pending !== null}
                    onClick={() => void startCheckout("monthly")}
                  >
                    {pending === "monthly"
                      ? "Redirecting…"
                      : `Monthly · €${pricing.proMonthlyEur}`}
                  </button>
                  <button
                    type="button"
                    className="lp-bill-btn lp-bill-btn--ghost"
                    disabled={pending !== null}
                    onClick={() => void startCheckout("annual")}
                  >
                    {pending === "annual"
                      ? "Redirecting…"
                      : `Annual · €${pricing.proAnnualEur}`}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="lp-bill-btn lp-bill-btn--ghost"
                  disabled={pending !== null}
                  onClick={() => void openPortal()}
                >
                  {pending === "portal" ? "Redirecting…" : "Manage subscription"}
                </button>
              )}
            </div>
          </article>
        </section>

        {account ? (
          <section className="lp-bill-usage" aria-label="Usage">
            <div className="lp-bill-usage-head">
              <div>
                <p className="lp-bill-kicker">Usage</p>
                <h2 className="lp-bill-usage-title">This period</h2>
              </div>
              <p className="lp-bill-note">{period}</p>
            </div>
            <div className="lp-bill-stats">
              <div className="lp-bill-stat">
                <strong>{account.tier}</strong>
                <span>Tier</span>
              </div>
              <div className="lp-bill-stat">
                <strong>{account.subscriptionStatus}</strong>
                <span>Status</span>
              </div>
              <div className="lp-bill-stat">
                <strong>{account.attemptsThisPeriod}</strong>
                <span>Attempts</span>
              </div>
              <div className="lp-bill-stat lp-bill-stat--accent">
                <strong>
                  {account.attemptsRemaining}/{account.limits.attemptsPerPeriod}
                </strong>
                <span>Remaining</span>
              </div>
            </div>
          </section>
        ) : null}

        {error && user ? <p className="lp-bill-error">{error}</p> : null}
      </div>
    </div>
  );
}
