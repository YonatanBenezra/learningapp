import { CatalogueGrid } from "@/features/catalogue/components/catalogue-grid";
import { FirstSessionGate } from "@/features/onboarding/first-session-gate";
import "@/features/catalogue/catalogue.css";

export default function CataloguePage() {
  return (
    <FirstSessionGate>
      <div className="lp-page lp-page-catalogue">
        <CatalogueGrid />
      </div>
    </FirstSessionGate>
  );
}
