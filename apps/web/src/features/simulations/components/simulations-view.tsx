import Link from "next/link";
import {
  SIMULATOR_DESCRIPTIONS,
  SIMULATOR_LABELS,
  SIMULATORS,
  problemsForSimulator,
  type SimulatorSlug,
} from "@/config/simulators";
import "../simulations.css";

export function SimulationsView() {
  return (
    <div className="lp-sim">
      <header className="lp-sim-hero">
        <div>
          <h1 className="lp-sim-title">Simulators</h1>
          <p className="lp-sim-lead">
            Eight practice tracks for AI engineering — each with its own grading harness,
            failure modes, and exercise catalogue.
          </p>
        </div>
        <span className="lp-sim-chip">{SIMULATORS.length} simulators</span>
      </header>

      <div className="lp-sim-grid" role="list">
        {SIMULATORS.map((slug) => (
          <SimulatorCard key={slug} slug={slug} />
        ))}
      </div>
    </div>
  );
}

function SimulatorCard({ slug }: { slug: SimulatorSlug }) {
  return (
    <Link
      href={problemsForSimulator(slug)}
      className="lp-sim-card"
      role="listitem"
    >
      <span className="lp-sim-card-kicker">Simulator</span>
      <h2 className="lp-sim-card-title">{SIMULATOR_LABELS[slug]}</h2>
      <p className="lp-sim-card-copy">{SIMULATOR_DESCRIPTIONS[slug]}</p>
      <span className="lp-sim-card-cta">Browse problems →</span>
    </Link>
  );
}
