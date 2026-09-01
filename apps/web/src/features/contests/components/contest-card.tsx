import Link from "next/link";
import { routes } from "@/config/routes";
import type { ContestListItem } from "@/types/contest";

function windowLabel(window: ContestListItem["window"]): string {
  if (window === "open") {
    return "Open";
  }
  if (window === "upcoming") {
    return "Upcoming";
  }
  return "Closed";
}

export function ContestCard({ contest }: { contest: ContestListItem }) {
  const href = routes.contest(contest.slug);
  let action = "View";
  if (contest.canEnter) {
    action = "Enter";
  } else if (contest.entered && contest.window === "open") {
    action = "Continue";
  }

  return (
    <article className="lp-card lp-card--exercise lp-card--path">
      <div className="lp-card-meta">
        <span className="lp-badge">Contest</span>
        <span className="lp-badge lp-badge--muted">{windowLabel(contest.window)}</span>
      </div>
      <h2 className="lp-card-title">{contest.title}</h2>
      <p className="lp-card-tags">{contest.intent}</p>
      <p className="lp-card-tags">
        {contest.timeBoxMinutes} min · pool of {contest.problemCount}
      </p>
      <Link href={href} className="lp-card-btn">
        {action}
      </Link>
    </article>
  );
}
