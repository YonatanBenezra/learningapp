export function ProblemsFigmaSkeleton() {
  return (
    <div
      className="lp-pfigma lp-pfigma--htb lp-pfigma-skel"
      aria-hidden="true"
      aria-busy="true"
      aria-label="Loading problems"
    >
      <div className="lp-pfigma-inner">
        <header className="lp-pfigma-head">
          <div className="lp-pfigma-head-copy">
            <span className="lp-pfigma-skel-line lp-pfigma-skel-eyebrow" />
            <span className="lp-pfigma-skel-line lp-pfigma-skel-title" />
            <span className="lp-pfigma-skel-line lp-pfigma-skel-subtitle lp-pfigma-skel-hide-mobile" />
          </div>
          <div className="lp-pfigma-stat-chips lp-pfigma-skel-hide-mobile">
            {[1, 2, 3].map((i) => (
              <span key={i} className="lp-pfigma-stat-chip lp-pfigma-skel-stat-chip">
                <span className="lp-pfigma-skel-line lp-pfigma-skel-stat-val" />
                <span className="lp-pfigma-skel-line lp-pfigma-skel-stat-label" />
              </span>
            ))}
          </div>
        </header>

        <div className="lp-pfigma-toolbar">
          <div className="lp-pfigma-segments lp-pfigma-skel-segments" aria-hidden>
            {[72, 56, 64, 68].map((w) => (
              <span
                key={w}
                className="lp-pfigma-skel-line lp-pfigma-skel-segment"
                style={{ width: w }}
              />
            ))}
          </div>

          <div className="lp-pfigma-toolbar-row lp-pfigma-toolbar-row--desktop">
            <span className="lp-pfigma-toolbar-divider" aria-hidden />
            <span className="lp-pfigma-skel-line lp-pfigma-skel-select" />
            <div className="lp-pfigma-toolbar-filters">
              <span className="lp-pfigma-skel-line lp-pfigma-skel-select" />
              <span className="lp-pfigma-skel-line lp-pfigma-skel-select" />
              <span className="lp-pfigma-skel-line lp-pfigma-skel-search" />
            </div>
          </div>

          <div className="lp-pfigma-toolbar-row lp-pfigma-toolbar-row--mobile">
            <span className="lp-pfigma-skel-line lp-pfigma-skel-search lp-pfigma-skel-search--mobile" />
            <span className="lp-pfigma-skel-line lp-pfigma-skel-filter-btn" />
          </div>
        </div>

        <div className="lp-pfigma-body">
          <div className="lp-pfigma-list-wrap">
            <div className="lp-pfigma-list">
              <div className="lp-pfigma-list-head lp-pfigma-skel-list-head" aria-hidden>
                <span className="lp-pfigma-skel-line lp-pfigma-skel-head-cell" />
                <span className="lp-pfigma-skel-line lp-pfigma-skel-head-cell lp-pfigma-skel-head-problem" />
                <span className="lp-pfigma-skel-line lp-pfigma-skel-head-cell" />
                <span className="lp-pfigma-skel-line lp-pfigma-skel-head-cell" />
                <span className="lp-pfigma-skel-line lp-pfigma-skel-head-cell" />
                <span className="lp-pfigma-skel-line lp-pfigma-skel-head-cell" />
              </div>
              <div className="lp-pfigma-list-body">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="lp-pfigma-skel-row" style={{ opacity: 1 - (i - 1) * 0.04 }}>
                    <span className="lp-pfigma-skel-line lp-pfigma-skel-status" />
                    <div className="lp-pfigma-skel-row-main">
                      <span className="lp-pfigma-skel-line lp-pfigma-skel-id" />
                      <span className="lp-pfigma-skel-line lp-pfigma-skel-row-title" />
                      <span className="lp-pfigma-skel-line lp-pfigma-skel-row-desc lp-pfigma-skel-hide-mobile" />
                    </div>
                    <span className="lp-pfigma-skel-line lp-pfigma-skel-pill lp-pfigma-skel-hide-mobile" />
                    <span className="lp-pfigma-skel-line lp-pfigma-skel-pill lp-pfigma-skel-hide-mobile" />
                    <span className="lp-pfigma-skel-line lp-pfigma-skel-rate lp-pfigma-skel-hide-mobile" />
                    <span className="lp-pfigma-skel-line lp-pfigma-skel-action" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="lp-pfigma-sidebar lp-pfigma-skel-hide-mobile">
            {[0, 1, 2].map((i) => (
              <div key={i} className="lp-pfigma-card lp-pfigma-skel-card">
                <span className="lp-pfigma-skel-line lp-pfigma-skel-card-eyebrow" />
                <span className="lp-pfigma-skel-line lp-pfigma-skel-card-title" />
                <span className="lp-pfigma-skel-line lp-pfigma-skel-card-body" />
                <span className="lp-pfigma-skel-line lp-pfigma-skel-card-btn" />
              </div>
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}
