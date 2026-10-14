export function HomeHeroSkeleton() {
  return (
    <div className="lp-home-hero-skeleton" aria-hidden="true" aria-busy="true">
      <div className="lp-home-hero-skeleton-inner">
        <div className="lp-home-hero-skeleton-copy">
          <span className="lp-home-skel lp-home-skel--badge" />
          <span className="lp-home-skel lp-home-skel--title" />
          <span className="lp-home-skel lp-home-skel--title lp-home-skel--title-short" />
          <span className="lp-home-skel lp-home-skel--lead" />
          <span className="lp-home-skel lp-home-skel--lead lp-home-skel--lead-short" />
          <div className="lp-home-hero-skeleton-actions">
            <span className="lp-home-skel lp-home-skel--btn" />
            <span className="lp-home-skel lp-home-skel--btn lp-home-skel--btn-ghost" />
          </div>
          <div className="lp-home-hero-skeleton-trust">
            <span className="lp-home-skel lp-home-skel--trust" />
            <span className="lp-home-skel lp-home-skel--trust" />
            <span className="lp-home-skel lp-home-skel--trust" />
          </div>
          <span className="lp-home-skel lp-home-skel--tracks-label" />
          <div className="lp-home-hero-skeleton-pills">
            <span className="lp-home-skel lp-home-skel--pill" />
            <span className="lp-home-skel lp-home-skel--pill" />
            <span className="lp-home-skel lp-home-skel--pill" />
            <span className="lp-home-skel lp-home-skel--pill" />
          </div>
        </div>
        <div className="lp-home-hero-skeleton-visual">
          <span className="lp-home-skel lp-home-skel--stack" />
        </div>
      </div>
    </div>
  );
}
