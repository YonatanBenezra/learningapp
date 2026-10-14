import { ProblemsFigmaSkeleton } from "@/features/problems/components/problems-figma-skeleton";
import "@/features/problems/problems-figma.css";

export default function ProblemsLoading() {
  return (
    <div className="lp-page lp-page-catalogue lp-page-problems">
      <ProblemsFigmaSkeleton />
    </div>
  );
}
