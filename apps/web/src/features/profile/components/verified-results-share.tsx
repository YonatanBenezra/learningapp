"use client";

import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { signedResultsApi } from "@/features/assessments/signed-results-api";
import { ApiError } from "@/lib/api-client";
import type { OwnedSignedResult } from "@/types/profile";

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

type VerifiedResultsShareProps = {
  profileSlug: string | null;
  profilePublished: boolean;
};

export function VerifiedResultsShare({
  profileSlug,
  profilePublished,
}: VerifiedResultsShareProps) {
  const [results, setResults] = useState<OwnedSignedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [copied, setCopied] = useState<"report" | "profile" | null>(null);

  useEffect(() => {
    let cancelled = false;
    signedResultsApi
      .listMine()
      .then((rows) => {
        if (!cancelled) {
          setResults(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load assessment results.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleShare(result: OwnedSignedResult) {
    setPendingId(result.id);
    setError(null);
    try {
      const next = await signedResultsApi.setShared(result.id, !result.shared);
      setResults((current) =>
        current.map((row) => (row.id === next.id ? next : row)),
      );
    } catch (caught: unknown) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not update sharing.",
      );
    } finally {
      setPendingId(null);
    }
  }

  async function copyLink(kind: "report" | "profile") {
    if (!profileSlug) {
      return;
    }
    const path =
      kind === "report"
        ? routes.profileReport(profileSlug)
        : routes.profile(profileSlug);
    const url = `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(url);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  }

  return (
    <section className="lp-acc-panel" aria-label="Verified results sharing">
      <div className="lp-acc-panel-head">
        <div>
          <p className="lp-acc-kicker">Verified</p>
          <h2 className="lp-acc-panel-title">Assessment results</h2>
        </div>
      </div>

      <p className="lp-acc-note">
        Choose which signed results appear on your public employer profile and
        report. Revoking share removes them from public view without invalidating
        the credential.
      </p>

      {profilePublished && profileSlug ? (
        <div className="lp-acc-actions lp-acc-actions--inline">
          <button
            type="button"
            className="lp-acc-btn lp-acc-btn--ghost"
            onClick={() => void copyLink("profile")}
          >
            {copied === "profile" ? "Copied" : "Copy profile link"}
          </button>
          <button
            type="button"
            className="lp-acc-btn lp-acc-btn--ghost"
            onClick={() => void copyLink("report")}
          >
            {copied === "report" ? "Copied" : "Copy report link"}
          </button>
        </div>
      ) : (
        <p className="lp-acc-note">
          Publish your profile before sharing employer links.
        </p>
      )}

      {loading ? <p className="lp-acc-note">Loading results…</p> : null}
      {error ? <p className="lp-acc-error">{error}</p> : null}

      {!loading && results.length === 0 ? (
        <p className="lp-acc-note">
          No signed assessment results yet. Finish a verified sitting to share
          one here.
        </p>
      ) : null}

      {results.length > 0 ? (
        <ul className="lp-acc-result-list">
          {results.map((result) => (
            <li key={result.id} className="lp-acc-result-row">
              <div>
                <strong>{result.assessmentSlug}</strong>
                <span>
                  {result.bandLabel} · {formatWhen(result.issuedAt)}
                </span>
                {result.revoked ? (
                  <span className="lp-acc-result-flag">Revoked by LabPath</span>
                ) : null}
              </div>
              <label
                className={`lp-acc-toggle lp-acc-toggle--compact${
                  result.revoked ? " is-disabled" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={result.shared}
                  disabled={result.revoked || pendingId === result.id}
                  onChange={() => void toggleShare(result)}
                />
                <span>
                  <strong>Share on profile</strong>
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
