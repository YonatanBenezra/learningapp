"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { GlobalLoader } from "@/components/ui/global-loader";
import { routes } from "@/config/routes";
import { authApi } from "@/features/auth/auth-api";
import { ApiError } from "@/lib/api-client";
import type { User } from "@/types/user";
import "../account-profile.css";

function initials(name: string, email: string) {
  const source = name.trim() || email.trim();
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function ProfileSettings() {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<"auth" | "load" | string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((result) => {
        if (cancelled) {
          return;
        }
        setUser(result);
        setDisplayName(result.displayName ?? "");
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

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setSaved(false);
    setError(null);
    try {
      await authApi.updateProfile({
        displayName: displayName.trim() || null,
        slug: null,
        enabled: false,
      });
      setUser((current) =>
        current
          ? {
              ...current,
              displayName: displayName.trim() || null,
            }
          : current,
      );
      setSaved(true);
    } catch (caught: unknown) {
      setError(
        caught instanceof ApiError ? caught.message : "Could not save profile.",
      );
    } finally {
      setPending(false);
    }
  }

  if (error === "auth") {
    return (
      <div className="lp-acc">
        <header className="lp-acc-hero">
          <div>
            <h1 className="lp-acc-title">Profile</h1>
            <p className="lp-acc-lead">Your display name and sign-in email.</p>
          </div>
        </header>
        <div className="lp-acc-banner">
          <strong>Sign in required</strong>
          <p>
            Sign in to manage your profile.{" "}
            <Link
              href={`${routes.login}?next=${encodeURIComponent(routes.account)}`}
              className="lp-acc-link"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (error === "load") {
    return (
      <div className="lp-acc">
        <header className="lp-acc-hero">
          <div>
            <h1 className="lp-acc-title">Profile</h1>
            <p className="lp-acc-lead">Your display name and sign-in email.</p>
          </div>
        </header>
        <div className="lp-acc-banner">
          <strong>Could not load profile settings</strong>
          <p>Check that the API is running, then refresh this page.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <GlobalLoader contained />;
  }

  const shownName = displayName.trim() || user.displayName || "Learner";

  return (
    <div className="lp-acc">
      <header className="lp-acc-hero">
        <div>
          <h1 className="lp-acc-title">Profile</h1>
          <p className="lp-acc-lead">Your display name and sign-in email.</p>
        </div>
      </header>

      <div className="lp-acc-layout">
        <section className="lp-acc-panel lp-acc-panel--identity" aria-label="Account">
          <div className="lp-acc-panel-head">
            <div>
              <p className="lp-acc-kicker">Account</p>
              <h2 className="lp-acc-panel-title">Identity</h2>
            </div>
          </div>

          <div className="lp-acc-identity">
            <span className="lp-acc-avatar" aria-hidden="true">
              {initials(shownName, user.email)}
            </span>
            <div className="lp-acc-identity-copy">
              <p className="lp-acc-name">{shownName}</p>
              <p className="lp-acc-email">{user.email}</p>
            </div>
          </div>
        </section>

        <section className="lp-acc-panel" aria-label="Profile settings">
          <div className="lp-acc-panel-head">
            <div>
              <p className="lp-acc-kicker">Settings</p>
              <h2 className="lp-acc-panel-title">Display name</h2>
            </div>
          </div>

          <form className="lp-acc-form" onSubmit={onSubmit}>
            <label className="lp-acc-field">
              <span className="lp-acc-label">Display name</span>
              <input
                className="lp-acc-input"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={40}
                autoComplete="nickname"
                placeholder="Your name"
              />
            </label>

            {typeof error === "string" ? (
              <p className="lp-acc-error">{error}</p>
            ) : null}
            {saved ? <p className="lp-acc-ok">Saved.</p> : null}

            <div className="lp-acc-actions">
              <button type="submit" className="lp-acc-btn" disabled={pending}>
                {pending ? "Saving…" : "Save profile"}
              </button>
              <Link href={routes.problems} className="lp-acc-btn lp-acc-btn--ghost">
                Back to problems
              </Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
