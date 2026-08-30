import { CatalogueGrid } from "@/features/catalogue/components/catalogue-grid";
import { FirstSessionGate } from "@/features/onboarding/first-session-gate";

export default function CataloguePage() {
  return (
    <FirstSessionGate>
      <div className="lp-page lp-page-catalogue">
        <header className="lp-cat-header">
          <h1 className="lp-cat-title">Catalogue</h1>
          <p className="lp-cat-lead">
            Graded exercises across RAG, prompt engineering, evaluation, and
            guardrails. Select a problem, submit your configuration, and receive
            a scorecard.
          </p>
        </header>
        <CatalogueGrid />
      </div>
    </FirstSessionGate>
  );
}
