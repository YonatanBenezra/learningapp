import { ProblemsGrid } from "@/features/problems/components/problems-grid";
import { FirstSessionGate } from "@/features/onboarding/first-session-gate";
import "@/features/problems/problems.css";

export default function ProblemsPage() {
  return (
    <FirstSessionGate>
      <div className="lp-page lp-page-catalogue lp-page-problems">
        <ProblemsGrid />
      </div>
    </FirstSessionGate>
  );
}
