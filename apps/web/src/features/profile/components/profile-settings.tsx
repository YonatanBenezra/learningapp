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
  const [slug, setSlug] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<"auth" | "load" | string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

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
        setSlug(result.profile?.slug ?? "");
        setEnabled(Boolean(result.profile?.public));
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

  const profile = user?.profile;
  const shareUrl =
    typeof window !== "undefined" && profile?.urlPath
      ? `${window.location.origin}${profile.urlPath}`
      : profile?.urlPath;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setSaved(false);
    setError(null);
    try {
      const next = await authApi.updateProfile({
        displayName: displayName.trim() || null,
        slug: slug.trim() || null,
        enabled,
      });
      setUser((current) =>
        current
          ? {
              ...current,
              displayName: displayName.trim() || null,
              profile: next,
            }
          : current,
      );
      setSlug(next.slug ?? "");
      setEnabled(next.public);
      setSaved(true);
    } catch (caught: unknown) {
      setError(
        caught instanceof ApiError ? caught.message : "Could not save profile.",
      );
    } finally {
      setPending(false);
    }
  }

  async function copyLink() {
    if (!shareUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (error === "auth") {
    return (
      <div className="lp-acc">
        <header className="lp-acc-hero">
          <div>
            <h1 className="lp-acc-title">Profile</h1>
            <p className="lp-acc-lead">
              Set your display name, public slug, and whether others can find you.
            </p>
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
            <p className="lp-acc-lead">
              Set your display name, public slug, and whether others can find you.
            </p>
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
  const tier = user.account?.tier ?? "free";
  const published = Boolean(profile?.published);

  return (
    <div className="lp-acc" id="public-profile">
      <header className="lp-acc-hero">
        <div>
          <h1 className="lp-acc-title">Profile</h1>
          <p className="lp-acc-lead">
            Set your display name, public slug, and whether others can find you.
          </p>
        </div>
        <div className="lp-acc-meta">
          <span className="lp-acc-chip lp-acc-chip--brand">{tier} plan</span>
          <span className="lp-acc-chip">
            {published ? "Published" : "Private"}
          </span>
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

          <div className="lp-acc-stats">
            <div className="lp-acc-stat lp-acc-stat--accent">
              <strong>{tier}</strong>
              <span>Tier</span>
            </div>
            <div className="lp-acc-stat">
              <strong>{user.role}</strong>
              <span>Role</span>
            </div>
            <div className="lp-acc-stat">
              <strong>{published ? "Public" : "Hidden"}</strong>
              <span>Visibility</span>
            </div>
            <div className="lp-acc-stat">
              <strong>{slug.trim() ? `/u/${slug.trim()}` : "—"}</strong>
              <span>Slug</span>
            </div>
          </div>

          {!profile?.canPublish ? (
            <p className="lp-acc-note">
              Public profiles are a Pro feature.{" "}
              <Link href={routes.billing}>Upgrade to Pro</Link>
            </p>
          ) : null}
        </section>

        <section className="lp-acc-panel" aria-label="Public profile settings">
          <div className="lp-acc-panel-head">
            <div>
              <p className="lp-acc-kicker">Share</p>
              <h2 className="lp-acc-panel-title">Public profile</h2>
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

            <label className="lp-acc-field">
              <span className="lp-acc-label">Profile URL</span>
              <span className="lp-acc-slug">
                <span className="lp-acc-slug-prefix">/u/</span>
                <input
                  className="lp-acc-input"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value.toLowerCase())}
                  maxLength={32}
                  spellCheck={false}
                  autoComplete="off"
                  placeholder="your-name"
                />
              </span>
            </label>

            <label
              className={`lp-acc-toggle${!profile?.canPublish ? " is-disabled" : ""}`}
            >
              <input
                type="checkbox"
                checked={enabled}
                disabled={!profile?.canPublish}
                onChange={(event) => setEnabled(event.target.checked)}
              />
              <span>
                <strong>Publish this profile</strong>
                <span>
                  Show verified solves and skill scores on your public page.
                </span>
              </span>
            </label>

            {typeof error === "string" ? (
              <p className="lp-acc-error">{error}</p>
            ) : null}
            {saved ? <p className="lp-acc-ok">Saved.</p> : null}

            <div className="lp-acc-actions">
              <button type="submit" className="lp-acc-btn" disabled={pending}>
                {pending ? "Saving…" : "Save profile"}
              </button>
              {profile?.published && shareUrl ? (
                <>
                  <Link
                    href={routes.profile(profile.slug ?? slug)}
                    className="lp-acc-btn lp-acc-btn--ghost"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    className="lp-acc-btn lp-acc-btn--ghost"
                    onClick={() => void copyLink()}
                  >
                    {copied ? "Copied" : "Copy link"}
                  </button>
                </>
              ) : null}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
