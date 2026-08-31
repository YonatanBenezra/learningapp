import { CatalogueGrid } from "@/features/catalogue/components/catalogue-grid";
import { FirstSessionGate } from "@/features/onboarding/first-session-gate";
import { PathStrip } from "@/features/paths/components/path-strip";

export default function CataloguePage() {
  return (
    <FirstSessionGate>
      <div className="lp-page lp-page-catalogue">
        <header className="lp-cat-header">
          <h1 className="lp-cat-title">Catalogue</h1>
          <p className="lp-cat-lead">
            Graded exercises across RAG, prompt engineering, evaluation,
            guardrails, agents, and benchmarks. Start a guided path or pick a
            problem and read the scorecard.
          </p>
        </header>
        <PathStrip />
        <CatalogueGrid />
      </div>
    </FirstSessionGate>
  );
}
