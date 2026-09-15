"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GlobalLoader } from "@/components/ui/global-loader";
import { routes } from "@/config/routes";
import { verifyApi } from "@/features/verify/verify-api";
import { env } from "@/lib/env";
import type {
  SignedResultView,
  VerifySignedResultResponse,
  VerifySignedResultStatus,
} from "@/types/verify";
import "@/features/contests/contests.css";
import "../verify.css";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : dateFormat.format(parsed);
}

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

const STATUS_COPY: Record<
  VerifySignedResultStatus,
  { badge: string; title: string; lead: string }
> = {
  valid: {
    badge: "Valid signature",
    title: "Verified assessment result",
    lead: "LabPath issued and signed this result. The signature matches our published key.",
  },
  revoked: {
    badge: "Revoked",
    title: "Revoked assessment result",
    lead: "This result was genuinely issued by LabPath but has been withdrawn after human review. The signature still verifies.",
  },
  invalid: {
    badge: "Invalid or unknown",
    title: "Result could not be verified",
    lead: "This id is unknown, malformed, or the signature does not match LabPath's published keys.",
  },
};

function ResultBody({ result }: { result: SignedResultView }) {
  const payload = result.payload;

  return (
    <>
      <div className="lp-vf-facts">
        <div className="lp-ct-fact">
          <strong>{payload.bandLabel}</strong>
          <span>Band</span>
        </div>
        <div className="lp-ct-fact">
          <strong>
            {payload.totalScore}/{payload.maxScore}
          </strong>
          <span>Total score</span>
        </div>
        <div className="lp-ct-fact">
          <strong>{formatElapsed(payload.elapsedMs)}</strong>
          <span>Elapsed</span>
        </div>
        <div className="lp-ct-fact">
          <strong>{payload.timeBoxMinutes}m</strong>
          <span>Time box</span>
        </div>
      </div>

      {payload.skills.length ? (
        <section className="lp-vf-panel" aria-label="Skill rollup">
          <h2 className="lp-vf-panel-title">Skill rollup</h2>
          <div className="lp-vf-facts" style={{ marginTop: "0.85rem" }}>
            {payload.skills.map((skill) => (
              <div key={skill.slug} className="lp-ct-fact">
                <strong>{skill.score}</strong>
                <span>{skill.name}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="lp-vf-panel" aria-label="Sitting conditions">
        <h2 className="lp-vf-panel-title">Sitting conditions</h2>
        <p className="lp-vf-panel-copy">
          Novel problems sampled from a hidden pool. Hints disabled. One timed
          sitting per Pro season.
        </p>
        <div className="lp-vf-conditions">
          <span className="lp-vf-condition">Time-boxed</span>
          <span className="lp-vf-condition">No hints</span>
          <span className="lp-vf-condition">
            {payload.sampleCount} sampled problems
          </span>
          <span className="lp-vf-condition">Verified assessment</span>
        </div>
      </section>

      <section className="lp-vf-panel" aria-label="Problems">
        <h2 className="lp-vf-panel-title">Problems in this sitting</h2>
        <div className="lp-vf-table-wrap">
          <table className="lp-ctd-table">
            <thead>
              <tr>
                <th>Problem</th>
                <th>Verdict</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {payload.items.map((item) => (
                <tr key={item.slug}>
                  <td>{item.title}</td>
                  <td>
                    <span
                      className={`lp-ctd-verdict lp-ctd-verdict--${item.verdict}`}
                    >
                      {item.verdict}
                    </span>
                  </td>
                  <td className="lp-ctd-table-score">{item.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="lp-vf-meta">
          <div>
            <dt>Issued</dt>
            <dd>{formatDate(result.issuedAt)}</dd>
          </div>
          <div>
            <dt>Assessment window</dt>
            <dd>
              {formatDate(payload.window.startsAt)} –{" "}
              {formatDate(payload.window.endsAt)}
            </dd>
          </div>
          {payload.seasonKey ? (
            <div>
              <dt>Season</dt>
              <dd>{payload.seasonKey}</dd>
            </div>
          ) : null}
          <div>
            <dt>Signing key</dt>
            <dd>{result.keyId}</dd>
          </div>
          <div>
            <dt>Result id</dt>
            <dd>{result.id}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}

export function VerifyResultView({ resultId }: { resultId: string }) {
  const [data, setData] = useState<VerifySignedResultResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    verifyApi
      .verify(resultId)
      .then((response) => {
        if (!cancelled) {
          setData(response);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [resultId]);

  if (!data && !error) {
    return <GlobalLoader label="Verifying result…" />;
  }

  const status: VerifySignedResultStatus = error
    ? "invalid"
    : (data?.status ?? "invalid");
  const copy = STATUS_COPY[status];
  const result = data?.result ?? null;

  return (
    <div className="lp-page lp-page-catalogue lp-page-verify">
      <div className="lp-vf">
        <header
          className={`lp-vf-hero lp-vf-hero--${status === "valid" ? "valid" : status}`}
        >
          <div>
            <p className="lp-vf-kicker">LabPath verification</p>
            <h1 className="lp-vf-title">{copy.title}</h1>
            <p className="lp-vf-lead">{copy.lead}</p>
            {result?.revokeReasonCode ? (
              <p className="lp-vf-lead">
                Revocation reason: {result.revokeReasonCode}
              </p>
            ) : null}
          </div>
          <span className={`lp-vf-badge lp-vf-badge--${status}`}>
            {copy.badge}
          </span>
        </header>

        {result ? <ResultBody result={result} /> : null}

        <section className="lp-vf-panel" aria-label="What LabPath asserts">
          <h2 className="lp-vf-panel-title">What LabPath asserts</h2>
          <p className="lp-vf-panel-copy">
            LabPath asserts what was solved, under what conditions, on what
            date. This is a point-in-time verified assessment result — not a
            professional certification, employment guarantee, or accreditation.
          </p>
          <p className="lp-vf-panel-copy">
            This page shows no learner email, account id, practice history,
            recordings, or hidden grading data.
          </p>
          <div className="lp-vf-links">
            <a
              href={`${env.apiUrl}/signing-keys`}
              className="lp-ct-btn lp-ct-btn--ghost"
              rel="noopener noreferrer"
            >
              Published signing keys
            </a>
            <Link href={routes.home} className="lp-ct-btn">
              About LabPath
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
