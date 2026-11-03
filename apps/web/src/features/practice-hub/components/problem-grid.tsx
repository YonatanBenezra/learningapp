import { ProblemCard } from "@/features/practice-hub/components/problem-card";
import type { PracticeProblemCard } from "@/features/practice-hub/types";

export function ProblemGrid({ problems }: { problems: PracticeProblemCard[] }) {
  if (problems.length === 0) {
    return (
      <p className="py-16 text-center text-sm tracking-[0.14px] text-platform-muted">
        No problems in this tab. Try another filter or clear your search.
      </p>
    );
  }

  return (
    <section
      className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Practice problems"
    >
      {problems.map((problem) => (
        <ProblemCard key={problem.slug} problem={problem} />
      ))}
    </section>
  );
}
