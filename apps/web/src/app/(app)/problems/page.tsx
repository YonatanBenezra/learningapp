import { Suspense } from "react";
import { ProblemsGrid } from "@/features/problems/components/problems-grid";
import { ProblemsSkeleton } from "@/features/problems/components/problems-skeleton";
import { FirstSessionGate } from "@/features/onboarding/first-session-gate";
import "@/features/problems/problems.css";

export default function ProblemsPage() {
  return (
    <FirstSessionGate>
      <div className="lp-page lp-page-catalogue lp-page-problems">
        <Suspense fallback={<ProblemsSkeleton />}>
          <ProblemsGrid />
        </Suspense>
      </div>
    </FirstSessionGate>
  );
}
