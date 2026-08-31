import Link from "next/link";
import { routes } from "@/config/routes";
import type { PathListItem } from "@/types/path";

export function PathCard({ path }: { path: PathListItem }) {
  const href = path.nextSlug
    ? `${routes.exercise(path.nextSlug)}?path=${encodeURIComponent(path.slug)}`
    : routes.path(path.slug);
  const label = path.complete
    ? "Completed"
    : path.passedCount > 0
      ? "Continue"
      : "Start path";

  return (
    <article className="lp-card lp-card--exercise lp-card--path">
      <div className="lp-card-meta">
        <span className="lp-badge">Path</span>
        <span className="lp-badge lp-badge--muted">
          {path.passedCount}/{path.stepCount}
        </span>
      </div>
      <h2 className="lp-card-title">{path.title}</h2>
      <p className="lp-card-tags">{path.intent}</p>
      <Link href={href} className="lp-card-btn">
        {label}
      </Link>
      <Link href={routes.path(path.slug)} className="lp-path-steps-link">
        View steps
      </Link>
    </article>
  );
}
