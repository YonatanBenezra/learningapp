export function CatalogueSkeleton() {
  return (
    <div className="lp-skel" aria-hidden="true">
      <div className="lp-cat-toolbar">
        <div className="lp-filter">
          {Array.from({ length: 5 }, (_, index) => (
            <span key={`track-${index}`} className="lp-skel-chip" />
          ))}
        </div>
        <div className="lp-filter">
          {Array.from({ length: 4 }, (_, index) => (
            <span key={`level-${index}`} className="lp-skel-chip lp-skel-chip--sm" />
          ))}
        </div>
      </div>
      <div className="lp-skel-line" />
      <div className="lp-grid lp-grid-catalogue">
        {Array.from({ length: 8 }, (_, index) => (
          <article key={index} className="lp-card lp-card--exercise lp-skel-card">
            <div className="lp-card-meta">
              <span className="lp-skel-chip lp-skel-chip--sm" />
              <span className="lp-skel-chip lp-skel-chip--sm" />
            </div>
            <span className="lp-skel-line lp-skel-line--title" />
            <span className="lp-skel-line lp-skel-line--tags" />
            <span className="lp-skel-btn" />
          </article>
        ))}
      </div>
    </div>
  );
}
