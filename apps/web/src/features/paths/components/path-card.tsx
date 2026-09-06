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
  const progress =
    path.stepCount > 0 ? Math.round((path.passedCount / path.stepCount) * 100) : 0;

  return (
    <article className="lp-path-card">
      <div className="lp-path-card-top">
        <span className="lp-path-mark">Path</span>
        <span className="lp-path-progress">
          {path.passedCount}/{path.stepCount}
        </span>
      </div>
      <div className="lp-path-bar" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      <h3 className="lp-path-card-title">{path.title}</h3>
      <p className="lp-path-card-copy">{path.intent}</p>
      <div className="lp-path-card-actions">
        <Link href={href} className="lp-cat-btn">
          {label}
        </Link>
        <Link href={routes.path(path.slug)} className="lp-path-steps-link">
          View steps
        </Link>
      </div>
    </article>
  );
}
