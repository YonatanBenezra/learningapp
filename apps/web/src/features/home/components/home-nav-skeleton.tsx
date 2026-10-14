export function HomeNavSkeleton() {
  return (
    <div
      className="lp-home-nav-skeleton"
      aria-hidden="true"
      aria-busy="true"
    >
      <div className="lp-home-nav-skeleton-inner lp-dash-nav-inner">
        <div className="lp-home-nav-skeleton-left">
          <span className="lp-home-skel lp-home-skel--logo" />
          <span className="lp-home-skel lp-home-skel--vrule" />
          <span className="lp-home-skel lp-home-skel--endorse max-[520px]:hidden" />
          <div className="lp-home-nav-skeleton-links max-[899px]:hidden">
            <span className="lp-home-skel lp-home-skel--link" />
            <span className="lp-home-skel lp-home-skel--link" />
            <span className="lp-home-skel lp-home-skel--link" />
          </div>
        </div>
        <div className="lp-home-nav-skeleton-right">
          <span className="lp-home-skel lp-home-skel--toggle max-[899px]:hidden" />
          <span className="lp-home-skel lp-home-skel--signin max-[899px]:hidden" />
          <span className="lp-home-skel lp-home-skel--cta max-[899px]:hidden" />
          <span className="lp-home-skel lp-home-skel--menu" />
        </div>
      </div>
    </div>
  );
}
