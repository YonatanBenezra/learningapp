import { Suspense } from "react";
import { ProblemsGrid } from "@/features/problems/components/problems-grid";
import { ProblemsSkeleton } from "@/features/problems/components/problems-skeleton";
import "@/features/problems/problems.css";

export default function ProblemsPage() {
  return (
    <div className="lp-page lp-page-catalogue lp-page-problems">
      <Suspense fallback={<ProblemsSkeleton />}>
        <ProblemsGrid />
      </Suspense>
    </div>
  );
}
