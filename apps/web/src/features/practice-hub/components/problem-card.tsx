"use client";

import Link from "next/link";
import { routes } from "@/config/routes";
import { ProblemBadge } from "@/features/practice-hub/components/problem-badge";
import { ProblemBanner } from "@/features/practice-hub/components/problem-banner";
import type { PracticeProblemCard } from "@/features/practice-hub/types";

export function ProblemCard({ problem }: { problem: PracticeProblemCard }) {
  const showStart = !problem.cleared;

  return (
    <article className="group relative flex h-[388px] flex-col rounded-sm bg-platform-card p-3 transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-platform-card-hover">
      <Link
        href={routes.exercise(problem.slug)}
        className="absolute inset-0 z-0 rounded-sm"
        aria-label={problem.title}
      />
      <div className="relative z-[1] shrink-0 pointer-events-none">
        <ProblemBanner title={problem.title} variant={problem.bannerVariant} />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <ProblemBadge tone="mcp">{problem.simulatorLabel}</ProblemBadge>
          <ProblemBadge tone="difficulty">{problem.difficultyLabel}</ProblemBadge>
          {problem.cleared ? <ProblemBadge tone="solved">Solved</ProblemBadge> : null}
        </div>
      </div>
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col px-2.5 pb-2.5 pt-[18px] pointer-events-none">
        <h2 className="lp-practice-hub-card-title truncate font-semibold text-platform-text">{problem.title}</h2>
        <p className="lp-practice-hub-card-meta mt-1.5 line-clamp-2 text-platform-muted">
          {problem.tags.length > 0 ? problem.tags.join(" · ") : problem.simulatorLabel}
        </p>
        <div className="mt-auto pt-4">
          <p className="lp-practice-hub-card-meta font-medium text-platform-text">
            {problem.cleared
              ? "Completed"
              : problem.solveRate != null && problem.solveRate > 0
                ? `${Math.round(problem.solveRate * 100)}% pass rate`
                : "Not started"}
          </p>
          {problem.cleared ? (
            <p className="lp-practice-hub-card-meta mt-1 text-platform-text/80">Review this lab</p>
          ) : null}
        </div>
      </div>
      {showStart ? (
        <Link
          href={routes.exercise(problem.slug)}
          className="lp-practice-hub-cta pointer-events-auto absolute bottom-1.5 right-3 z-[2] inline-flex h-10 min-w-[100px] items-center justify-center rounded-sm bg-platform-accent px-5 font-semibold text-platform-accent-on opacity-0 shadow-md transition-opacity duration-150 hover:opacity-90 group-hover:opacity-100 group-focus-within:opacity-100"
        >
          Start
        </Link>
      ) : null}
    </article>
  );
}
