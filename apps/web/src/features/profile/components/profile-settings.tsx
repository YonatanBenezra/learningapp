"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { routes } from "@/config/routes";
import { authApi } from "@/features/auth/auth-api";
import { ApiError } from "@/lib/api-client";
import type { User } from "@/types/user";

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

  return (
    <section className="lp-panel lp-pg-panel" id="public-profile">
      <div className="lp-pg-panel-top">
        <div>
          <p className="lp-panel-eyebrow">Share</p>
          <h2 className="lp-panel-title">Public profile</h2>
        </div>
      </div>
      {error === "auth" ? (
        <p className="lp-pg-note">
          Sign in to manage your profile.{" "}
          <Link
            href={`${routes.login}?next=${encodeURIComponent(routes.progress)}`}
            className="lp-link"
          >
            Sign in
          </Link>
        </p>
      ) : null}
      {error === "load" ? (
        <p className="lp-pg-note">Could not load profile settings.</p>
      ) : null}
      {user ? (
        <form className="lp-pg-profile" onSubmit={onSubmit}>
          <label className="lp-pg-field">
            <span>Display name</span>
            <input
              className="lp-field-input"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={40}
              autoComplete="nickname"
            />
          </label>
          <label className="lp-pg-field">
            <span>Profile URL</span>
            <span className="lp-pg-slug">
              <span className="lp-pg-slug-prefix">/u/</span>
              <input
                className="lp-field-input"
                value={slug}
                onChange={(event) => setSlug(event.target.value.toLowerCase())}
                maxLength={32}
                spellCheck={false}
                autoComplete="off"
                placeholder="your-name"
              />
            </span>
          </label>
          <label className="lp-pg-check">
            <input
              type="checkbox"
              checked={enabled}
              disabled={!profile?.canPublish}
              onChange={(event) => setEnabled(event.target.checked)}
            />
            <span>Publish this profile</span>
          </label>
          {!profile?.canPublish ? (
            <p className="lp-pg-note">
              Public profiles are a Pro feature.{" "}
              <Link href={routes.billing} className="lp-link">
                Upgrade to Pro
              </Link>
            </p>
          ) : null}
          {typeof error === "string" ? (
            <p className="lp-pg-note">{error}</p>
          ) : null}
          {saved ? <p className="lp-pg-note">Saved.</p> : null}
          <div className="lp-pg-actions">
            <button type="submit" className="lp-btn lp-btn-primary" disabled={pending}>
              {pending ? "Saving…" : "Save profile"}
            </button>
            {profile?.published && shareUrl ? (
              <>
                <Link href={routes.profile(profile.slug ?? slug)} className="lp-btn lp-btn-ghost">
                  View
                </Link>
                <button type="button" className="lp-btn lp-btn-ghost" onClick={copyLink}>
                  {copied ? "Copied" : "Copy link"}
                </button>
              </>
            ) : null}
          </div>
        </form>
      ) : null}
    </section>
  );
}
