import { CatalogueGrid } from "@/features/catalogue/components/catalogue-grid";

export default function CataloguePage() {
  return (
    <div className="lp-page lp-page-catalogue">
      <header className="lp-page-header">
        <p className="lp-page-eyebrow">Practice library</p>
        <h1 className="lp-page-title">Catalogue</h1>
        <p className="lp-page-lead">
          Graded exercises across RAG, prompt engineering, evaluation, and
          guardrails. Select a problem, submit your configuration, and receive
          a scorecard.
        </p>
      </header>
      <CatalogueGrid />
    </div>
  );
}
