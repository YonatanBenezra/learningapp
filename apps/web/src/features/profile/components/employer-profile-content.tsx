"use client";

import Link from "next/link";
import { routes } from "@/config/routes";
import { skillBarWidths, skillStaleNote } from "@/features/progress/skill-freshness";
import type { PublicProfile } from "@/types/profile";

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

type EmployerProfileContentProps = {
  profile: PublicProfile;
  printable?: boolean;
};

export function EmployerProfileContent({
  profile,
  printable = false,
}: EmployerProfileContentProps) {
  const scoredSkills = profile.skills.filter((skill) => skill.score > 0).length;

  return (
    <div className={`lp-pp${printable ? " lp-pp--print" : ""}`}>
      <header className="lp-pp-hero">
        <div className="lp-pp-identity">
          <div className="lp-pp-copy">
            <p className="lp-pp-kicker">
              {printable ? "Verified skill report" : "Employer view"}
            </p>
            <h1 className="lp-pp-title">{profile.displayName}</h1>
            <p className="lp-pp-lead">
              Verified assessment results first, then decayed practice radar and
              depth. Nothing here is published without the learner&apos;s opt-in.
            </p>
          </div>
        </div>
        <div className="lp-pp-meta">
          <span className="lp-pp-chip lp-pp-chip--brand">/{profile.slug}</span>
          {printable ? (
            <button
              type="button"
              className="lp-ct-btn lp-pp-print-btn"
              onClick={() => window.print()}
            >
              Print report
            </button>
          ) : (
            <Link
              href={routes.profileReport(profile.slug)}
              className="lp-ct-btn lp-ct-btn--ghost"
            >
              Printable report
            </Link>
          )}
        </div>
      </header>

      <section className="lp-pp-stats" aria-label="Headline signals">
        <div className="lp-pp-stat lp-pp-stat--rating">
          <span className="lp-pp-stat-value">
            {profile.contestRating ?? "—"}
          </span>
          <span className="lp-pp-stat-label">Contest rating</span>
          <span className="lp-pp-stat-note">Competitive seasons</span>
        </div>
        <div className="lp-pp-stat">
          <span className="lp-pp-stat-value">{profile.practiceRating}</span>
          <span className="lp-pp-stat-label">Practice rating</span>
          <span className="lp-pp-stat-note">Solves + recency</span>
        </div>
        <div className="lp-pp-stat">
          <span className="lp-pp-stat-value">
            {profile.verifiedResults.length}
          </span>
          <span className="lp-pp-stat-label">Shared results</span>
          <span className="lp-pp-stat-note">Point-in-time</span>
        </div>
        <div className="lp-pp-stat">
          <span className="lp-pp-stat-value">{profile.streak.current}</span>
          <span className="lp-pp-stat-label">Day streak</span>
          <span className="lp-pp-stat-note">Best {profile.streak.longest}</span>
        </div>
      </section>

      <section className="lp-pp-panel lp-pp-panel--verified" aria-label="Verified results">
        <div className="lp-pp-panel-head">
          <div>
            <p className="lp-pp-panel-kicker">Verified</p>
            <h2 className="lp-pp-panel-title">Assessment results</h2>
          </div>
          <p className="lp-pp-panel-note">
            Signed by LabPath · does not decay
          </p>
        </div>
        <p className="lp-pp-scope-note">
          Each result is a point-in-time claim from a timed, no-hints sitting.
          The skill radar below may fade with time away from practice (O13).
        </p>

        {profile.verifiedResults.length === 0 ? (
          <p className="lp-pp-empty">
            No verified assessment results are shared on this profile yet.
          </p>
        ) : (
          <div className="lp-pp-verified-list">
            {profile.verifiedResults.map((result) => (
              <article key={result.id} className="lp-pp-verified-card">
                <div className="lp-pp-verified-head">
                  <div>
                    <h3 className="lp-pp-verified-title">
                      {result.assessmentSlug}
                    </h3>
                    <p className="lp-pp-verified-meta">
                      Issued {formatWhen(result.issuedAt)} ·{" "}
                      {result.timeBoxMinutes}m box
                    </p>
                  </div>
                  <span className="lp-ct-badge lp-ct-badge--entered">
                    {result.bandLabel}
                  </span>
                </div>
                <p className="lp-pp-verified-score">
                  Score {result.totalScore}/{result.maxScore}
                </p>
                {result.skills.length ? (
                  <div className="lp-pp-verified-skills">
                    {result.skills.map((skill) => (
                      <span key={skill.slug} className="lp-pp-verified-skill">
                        {skill.name} {skill.score}
                      </span>
                    ))}
                  </div>
                ) : null}
                <Link
                  href={routes.verifyResult(result.id)}
                  className="lp-ct-btn lp-ct-btn--ghost lp-pp-verify-link"
                >
                  Verify this result
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="lp-pp-layout">
        <section className="lp-pp-panel" aria-label="Skills">
          <div className="lp-pp-panel-head">
            <div>
              <p className="lp-pp-panel-kicker">Practice radar</p>
              <h2 className="lp-pp-panel-title">Decayed skill snapshot</h2>
            </div>
            <p className="lp-pp-panel-note">
              {scoredSkills} scored · may fade over time
            </p>
          </div>

          {profile.skills.length === 0 ? (
            <p className="lp-pp-empty">No public skill scores yet.</p>
          ) : (
            <div className="lp-pp-skills">
              {profile.skills.map((skill) => {
                const blank = skill.score <= 0;
                const note = skillStaleNote(skill);
                const bar = skillBarWidths(skill);
                return (
                  <div key={skill.slug} className="lp-pp-skill">
                    <div className="lp-pp-skill-top">
                      <p className="lp-pp-skill-name">{skill.name}</p>
                      <span
                        className={`lp-pp-skill-score${blank ? " is-empty" : ""}`}
                      >
                        {blank ? "—" : skill.score.toFixed(2)}
                      </span>
                    </div>
                    <div className="lp-pp-bar" aria-hidden="true">
                      <span
                        className="lp-pp-bar-raw"
                        style={{ width: `${bar.raw}%` }}
                      >
                        <span
                          className="lp-pp-bar-fill"
                          style={{ width: `${bar.fill}%` }}
                        />
                      </span>
                    </div>
                    {note ? <p className="lp-pp-skill-stale">{note}</p> : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="lp-pp-panel" aria-label="Practice depth">
          <div className="lp-pp-panel-head">
            <div>
              <p className="lp-pp-panel-kicker">Depth</p>
              <h2 className="lp-pp-panel-title">Practice evidence</h2>
            </div>
          </div>

          <div className="lp-pp-depth-stats">
            <div className="lp-pp-stat">
              <span className="lp-pp-stat-value">{profile.attempts}</span>
              <span className="lp-pp-stat-label">attempts</span>
            </div>
            <div className="lp-pp-stat">
              <span className="lp-pp-stat-value">{profile.solves}</span>
              <span className="lp-pp-stat-label">unique solves</span>
            </div>
          </div>

          {profile.recent.length === 0 ? (
            <p className="lp-pp-empty">No public solves yet.</p>
          ) : (
            <ul className="lp-pp-solves">
              {profile.recent.map((item) => (
                <li key={item.slug}>
                  <div className="lp-pp-solve">
                    <p className="lp-pp-solve-title">{item.title}</p>
                    <span className="lp-pp-solve-date">
                      {formatWhen(item.passedAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="lp-pp-panel lp-pp-panel--scope" aria-label="Scope">
        <h2 className="lp-pp-panel-title">What LabPath asserts</h2>
        <p className="lp-pp-scope-note">
          LabPath asserts what was solved or assessed, under what conditions, on
          what date. This is not a professional certification, employment
          guarantee, or accreditation. Verified bands reflect assessed sittings;
          contest ratings reflect competitive seasons.
        </p>
      </section>
    </div>
  );
}
