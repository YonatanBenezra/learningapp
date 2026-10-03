"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Flag,
  Lock,
  MessageSquare,
  Radar,
  Target,
  Timer,
  Eye,
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { routes } from "@/config/routes";
import type { G1RunDetailModel, G1RunTimelineKind } from "@/features/traces/demo/g1-run-demo-data";
import { cn } from "@/lib/utils";
import "../run-detail-guardrails-figma.css";

type GuardrailsG1RunDetailProps = {
  model: G1RunDetailModel;
  inFlight?: boolean;
  workerMaybeOffline?: boolean;
};

export function GuardrailsG1RunDetail({
  model,
  inFlight = false,
  workerMaybeOffline = false,
}: GuardrailsG1RunDetailProps) {
  const title = `Attempt #${model.attempt} · ${model.exerciseTitle}`;

  return (
    <div className="lp-page lp-page-catalogue lp-g1-run">
      <div className="lp-g1-run-inner">
        <header className="lp-g1-run-hero">
          <div className="lp-g1-run-hero-main">
            <h1 className="lp-g1-run-title">{title}</h1>
            <div className="lp-g1-run-meta-row">
              <StatusBadge label={model.statusLabel} />
              {model.verdict ? (
                <StatusBadge label={model.verdict} tone={model.verdict === "pass" ? "pass" : "fail"} />
              ) : inFlight ? (
                <StatusBadge label="grading" tone="live" />
              ) : null}
              <span className="lp-g1-run-id">{model.runIdDisplay}</span>
              <nav className="lp-g1-run-links" aria-label="Run navigation">
                <Link href={routes.trace(model.runId)}>Trace</Link>
                <Link href={routes.exercise(model.exerciseSlug)}>Back to workspace</Link>
              </nav>
            </div>
          </div>

          <div
            className={cn(
              "lp-g1-run-progress",
              model.progressCleared && "is-cleared",
              !model.progressCleared && model.progressFillPct > 0 && "is-amber",
            )}
            role="img"
            aria-label={`Level progress: ${model.progressLabel}`}
          >
            <span
              className="lp-g1-run-progress-fill"
              style={{ width: `${model.progressFillPct}%` }}
              aria-hidden
            />
            <span className="lp-g1-run-progress-label">{model.progressLabel}</span>
          </div>
        </header>

        {inFlight ? (
          <p className="lp-g1-run-banner" role="status" aria-live="polite">
            <span className="lp-g1-run-banner-dot" aria-hidden />
            Grading in progress — this page updates automatically.
          </p>
        ) : null}
        {workerMaybeOffline ? (
          <p className="lp-g1-run-banner lp-g1-run-banner--warn" role="status">
            The grading worker may be offline. Your run is still queued.
          </p>
        ) : null}

        <div className="lp-g1-run-stats">
          <RunStatCard
            icon={Flag}
            label="Level reached"
            value={model.stats.levelReached}
            foot={model.stats.levelFoot}
          />
          <RunStatCard
            icon={MessageSquare}
            label="Messages"
            value={model.stats.messages}
            foot={model.stats.messagesFoot}
          />
          <RunStatCard
            icon={Radar}
            label="Canary event"
            value={model.stats.canaryEvent}
            foot={model.stats.canaryFoot}
          />
          <RunStatCard
            icon={Timer}
            label="Time on level"
            value={model.stats.timeOnLevel}
            foot={model.stats.timeFoot}
          />
        </div>

        <div className="lp-g1-run-body">
          <section className="lp-g1-run-panel lp-g1-run-timeline" aria-labelledby="g1-timeline-title">
            <h2 id="g1-timeline-title" className="lp-g1-run-panel-title">
              Timeline
            </h2>
            <ol className="lp-g1-run-timeline-list">
              {model.timeline.map((event) => (
                <li key={event.id}>
                  <TimelineIcon kind={event.kind} />
                  <div className="lp-g1-run-timeline-copy">
                    <time dateTime={event.time}>{event.time}</time>
                    <span>{event.label}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section
            className="lp-g1-run-panel lp-g1-run-log"
            aria-labelledby="g1-log-title"
          >
            <h2 id="g1-log-title" className="lp-g1-run-panel-title">
              Messages &amp; detector hits
            </h2>
            {model.messages.length === 0 ? (
              <p className="lp-g1-run-empty">
                Chat log for this run is in{" "}
                <Link href={routes.trace(model.runId)} className="lp-g1-run-link">
                  Trace
                </Link>
                .
              </p>
            ) : (
              <div className="lp-g1-run-table-wrap">
                <table className="lp-g1-run-table">
                  <thead>
                    <tr>
                      <th scope="col">Turn</th>
                      <th scope="col">Role</th>
                      <th scope="col">Message</th>
                      <th scope="col">Detectors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.messages.map((row, index) => (
                      <tr
                        key={`${row.turn}-${row.role}-${index}`}
                        className={row.highlight ? "is-hit" : undefined}
                      >
                        <td>{row.turn}</td>
                        <td>
                          <span
                            className={cn(
                              "lp-g1-run-role",
                              row.role === "user" && "is-user",
                            )}
                          >
                            {row.role === "user" ? "User" : "Concierge"}
                          </span>
                        </td>
                        <td>{row.message}</td>
                        <td>
                          {row.detector === "partial" ? (
                            <DetectorPill tone="partial" />
                          ) : row.detector === "canary-hit" ? (
                            <DetectorPill tone="canary" />
                          ) : (
                            <span className="lp-g1-run-detector-empty">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="lp-g1-run-log-foot">
              <Lock size={12} strokeWidth={2.25} aria-hidden />
              Canary value is masked in logs. Hidden detector rules are never shown.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "pass" | "fail" | "live";
}) {
  return (
    <span className={cn("lp-g1-run-badge", tone !== "neutral" && `is-${tone}`)}>
      {tone === "pass" || tone === "fail" ? (
        <span className="lp-g1-run-badge-dot" aria-hidden />
      ) : null}
      {label}
    </span>
  );
}

function RunStatCard({
  icon: Icon,
  label,
  value,
  foot,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  foot: string;
}) {
  return (
    <div className="lp-g1-run-stat">
      <Icon className="lp-g1-run-stat-icon" size={15} strokeWidth={2} aria-hidden />
      <p className="lp-g1-run-stat-label">{label}</p>
      <p className="lp-g1-run-stat-value">{value}</p>
      <p className="lp-g1-run-stat-foot">{foot}</p>
    </div>
  );
}

function TimelineIcon({ kind }: { kind: G1RunTimelineKind }) {
  const className = "lp-g1-run-timeline-icon";
  switch (kind) {
    case "level-start":
      return <Flag className={className} size={14} aria-hidden />;
    case "partial":
      return <AlertTriangle className={className} size={14} aria-hidden />;
    case "canary":
      return <Target className={className} size={14} aria-hidden />;
    case "cleared":
      return <CheckCircle2 className={className} size={14} aria-hidden />;
    default:
      return <Eye className={className} size={14} aria-hidden />;
  }
}

function DetectorPill({ tone }: { tone: "partial" | "canary" }) {
  return (
    <span className={cn("lp-g1-run-detector", tone === "canary" && "is-canary")}>
      <span className="lp-g1-run-detector-dot" aria-hidden />
      {tone === "partial" ? "partial" : "canary hit"}
    </span>
  );
}

export function GuardrailsG1RunDetailSkeleton() {
  return (
    <div className="lp-page lp-page-catalogue lp-g1-run" aria-busy="true">
      <div className="lp-g1-run-inner lp-g1-run-skel">
        <span className="lp-skel-line" style={{ width: "min(28rem, 90%)", height: "1.75rem" }} />
        <span className="lp-skel-line" style={{ width: "70%", height: "0.85rem", marginTop: "0.75rem" }} />
        <div className="lp-g1-run-stats" style={{ marginTop: "1.5rem" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="lp-g1-run-stat lp-g1-run-stat--skel" />
          ))}
        </div>
      </div>
    </div>
  );
}
