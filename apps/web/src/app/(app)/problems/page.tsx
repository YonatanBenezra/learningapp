import { headers } from "next/headers";
import { ProblemsPageContent } from "@/features/problems/components/problems-page-content";
import "@/features/problems/problems-figma.css";

export default async function ProblemsPage() {
  await headers();

  return (
    <div className="lp-page lp-page-catalogue lp-page-problems">
      <ProblemsPageContent />
    </div>
  );
}
