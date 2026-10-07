import {
  Database,
  Eye,
  Lock,
  MessageSquare,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { DotPattern } from "@/components/ui";
import {
  guardrailsGuidedPath,
  guardrailsSimulatorCard,
  ragSimulatorRow,
  simulationsPageCopy,
} from "../simulations-demo-data";
import "../simulations.css";

const pipelineIcons = {
  chat: MessageSquare,
  inject: Zap,
  detect: Eye,
  grade: Shield,
} as const;

export function SimulationsView() {
  const copy = simulationsPageCopy;
  const card = guardrailsSimulatorCard;
  const path = guardrailsGuidedPath;

  return (
    <div className="lp-sim">
      <header className="lp-sim-page-head">
        <div>
          <div className="lp-sim-page-title-row">
            <h1 className="lp-sim-title">{copy.title}</h1>
            <span className="lp-sim-chip lp-sim-chip--brand">{copy.liveCountLabel}</span>
          </div>
          <p className="lp-sim-lead">{copy.lead}</p>
        </div>
      </header>

      <section className="lp-sim-promo" aria-labelledby="sim-promo-title">
        <DotPattern
          className="lp-sim-promo-grid mask-[radial-gradient(420px_circle_at_70%_20%,white,transparent)] opacity-40"
          width={20}
          height={20}
        />
        <div className="lp-sim-promo-inner">
          <div className="lp-sim-promo-copy">
            <div className="lp-sim-promo-badges">
              {copy.promoBadges.map((badge) => (
                <span key={badge} className="lp-sim-promo-badge">
                  {badge}
                </span>
              ))}
            </div>
            <h2 id="sim-promo-title" className="lp-sim-promo-title">
              {copy.promoTitle}
            </h2>
            <p className="lp-sim-promo-lead">{copy.promoCopy}</p>
          </div>
          <dl className="lp-sim-promo-stats">
            <div>
              <dt>Run</dt>
              <dd>
                <Link href={copy.promoRun.runHref} className="lp-sim-promo-run-link">
                  {copy.promoRun.runId}
                </Link>
              </dd>
            </div>
            <div>
              <dt>Exercise</dt>
              <dd>{copy.promoRun.exercise}</dd>
            </div>
            <div>
              <dt>{copy.promoRun.canary.label}</dt>
              <dd className="lp-sim-promo-pass">
                {copy.promoRun.canary.value}
                {copy.promoRun.canary.pass ? (
                  <span className="lp-sim-promo-check" aria-hidden>
                    {" "}
                    ✓
                  </span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt>attempts</dt>
              <dd>{copy.promoRun.attempts}</dd>
            </div>
          </dl>
        </div>
      </section>

      <article className="lp-sim-feature">
        <div className="lp-sim-feature-main">
          <span className="lp-sim-card-kicker">{card.kicker}</span>
          <h2 className="lp-sim-feature-title">{card.title}</h2>
          <p className="lp-sim-feature-copy">{card.description}</p>
          <ul className="lp-sim-tags">
            {card.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
          <div className="lp-sim-feature-cta-row">
            <Link href={card.problemsHref} className="lp-sim-hero-cta lp-sim-feature-cta">
              Browse problems
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        <div className="lp-sim-feature-side">
          <div className="lp-sim-pipeline" aria-label="Pipeline preview">
            {card.pipeline.map((step, index) => {
              const Icon = pipelineIcons[step.id];
              const active = index === card.activePipelineStep;
              return (
                <div key={step.id} className="lp-sim-pipeline-step-wrap">
                  {index > 0 ? <span className="lp-sim-pipeline-arrow" aria-hidden /> : null}
                  <span
                    className={`lp-sim-pipeline-step${active ? " is-active" : ""}`}
                  >
                    {Icon ? <Icon className="size-3 shrink-0" strokeWidth={2} aria-hidden /> : null}
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="lp-sim-stat-grid">
            {card.stats.map((stat) => (
              <div key={stat.label} className="lp-sim-stat">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="lp-sim-graded">
            <span className="lp-sim-graded-label">Graded on</span>
            <ul className="lp-sim-graded-tags">
              {card.gradedOn.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </div>
        </div>

        <footer className="lp-sim-feature-path">
          <div className="lp-sim-feature-path-head">
            <span className="lp-sim-path-kicker">{path.title}</span>
            <span className="lp-sim-path-name">{path.name}</span>
          </div>
          <ol className="lp-sim-path-steps">
            {path.steps.map((step) => {
              const className = `lp-sim-path-step${step.active ? " is-active" : ""}${step.locked ? " is-locked" : ""}`;
              const inner = (
                <>
                  <span className="lp-sim-path-step-id">
                    {step.locked ? (
                      <Lock className="size-3" strokeWidth={2.25} aria-hidden />
                    ) : (
                      step.id
                    )}
                  </span>
                  {step.label}
                </>
              );
              return (
                <li key={step.id}>
                  {step.locked ? (
                    <span className={className} aria-disabled="true">
                      {inner}
                    </span>
                  ) : (
                    <Link href={step.href} className={className}>
                      {inner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
          <Link href={path.ctaHref} className="lp-sim-path-cta">
            {path.ctaLabel}
          </Link>
        </footer>
      </article>

      <section className="lp-sim-coming-soon lp-sim-coming-soon--live" aria-labelledby="sim-rag-live">
        <div className="lp-sim-coming-soon-icon" aria-hidden>
          <Database className="size-5" strokeWidth={1.75} />
        </div>
        <div className="lp-sim-coming-soon-copy">
          <h2 id="sim-rag-live" className="lp-sim-coming-soon-title">
            {ragSimulatorRow.title}
          </h2>
          <p className="lp-sim-coming-soon-lead">{ragSimulatorRow.description}</p>
        </div>
        <span className="lp-sim-coming-soon-pill lp-sim-coming-soon-pill--live">Live</span>
        <div className="lp-sim-coming-soon-actions">
          <Link href={ragSimulatorRow.problemsHref} className="lp-sim-hero-cta">
            Browse problems
          </Link>
          <Link href={ragSimulatorRow.demoTraceHref} className="lp-sim-feature-cta-secondary">
            Open first problem
          </Link>
          <Link href={ragSimulatorRow.startHref} className="lp-sim-path-cta">
            {ragSimulatorRow.startLabel}
          </Link>
        </div>
      </section>

      <p className="lp-sim-footnote">
        <span aria-hidden>💡</span> {copy.footnote}
      </p>
    </div>
  );
}
