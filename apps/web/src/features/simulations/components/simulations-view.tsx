import Link from "next/link";
import { DotPattern } from "@/components/ui";
import {
  ragGuidedPath,
  ragSimulatorCard,
  simulationsPageCopy,
} from "../simulations-demo-data";
import "../simulations.css";

export function SimulationsView() {
  const copy = simulationsPageCopy;
  const card = ragSimulatorCard;
  const path = ragGuidedPath;

  return (
    <div className="lp-sim">
      <header className="lp-sim-page-head">
        <div>
          <div className="lp-sim-page-title-row">
            <h1 className="lp-sim-title">{copy.title}</h1>
            <span className="lp-sim-chip lp-sim-chip--brand">{copy.simulatorCountLabel}</span>
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
            <span className="lp-sim-promo-kicker">{copy.promoKicker}</span>
            <h2 id="sim-promo-title" className="lp-sim-promo-title">
              {copy.promoTitle}
            </h2>
            <p className="lp-sim-promo-lead">{copy.promoCopy}</p>
          </div>
          <dl className="lp-sim-promo-stats">
            <div>
              <dt>Run</dt>
              <dd>{copy.promoRun.runId}</dd>
            </div>
            <div>
              <dt>Exercise</dt>
              <dd>{copy.promoRun.exercise}</dd>
            </div>
            <div>
              <dt>recall@5</dt>
              <dd className="lp-sim-promo-pass">
                {copy.promoRun.recall.value}{" "}
                <span>{copy.promoRun.recall.threshold}</span>
              </dd>
            </div>
            <div>
              <dt>Cost</dt>
              <dd>{copy.promoRun.cost}</dd>
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
              Browse live problems
              <span aria-hidden>→</span>
            </Link>
            {"demoTraceHref" in card && card.demoTraceHref ? (
              <Link href={card.demoTraceHref} className="lp-sim-feature-cta-secondary">
                Sample trace UI
              </Link>
            ) : null}
          </div>
        </div>

        <div className="lp-sim-feature-side">
          <div className="lp-sim-pipeline" aria-label="Pipeline preview">
            {card.pipeline.map((step, index) => (
              <div key={step} className="lp-sim-pipeline-step-wrap">
                {index > 0 ? <span className="lp-sim-pipeline-arrow" aria-hidden /> : null}
                <span
                  className={`lp-sim-pipeline-step${index === card.activePipelineStep ? " is-active" : ""}`}
                >
                  {step}
                </span>
              </div>
            ))}
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
              const href = "href" in step ? step.href : undefined;
              const className = `lp-sim-path-step${step.active ? " is-active" : ""}`;
              return (
                <li key={step.id}>
                  {href ? (
                    <Link href={href} className={className}>
                      <span className="lp-sim-path-step-id">{step.id}</span>
                      {step.label}
                    </Link>
                  ) : (
                    <span className={className}>
                      <span className="lp-sim-path-step-id">{step.id}</span>
                      {step.label}
                    </span>
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

      <p className="lp-sim-footnote">
        <span aria-hidden>💡</span> {copy.footnote}
      </p>
    </div>
  );
}
