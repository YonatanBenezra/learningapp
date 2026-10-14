export function ProblemsFigmaSkeleton() {
  return (
    <div className="lp-pfigma lp-pfigma-skel" aria-hidden="true" aria-busy="true" aria-label="Loading problems">
      <div className="lp-pfigma-inner">
        <header className="lp-pfigma-head">
          <div className="lp-pfigma-head-copy">
            <span className="lp-pfigma-skel-block" style={{ width: "11rem", height: "0.75rem" }} />
            <span className="lp-pfigma-skel-block" style={{ width: "min(12rem, 70%)", height: "2.25rem", marginTop: "0.35rem" }} />
            <span className="lp-pfigma-skel-block lp-pfigma-skel-hide-mobile" style={{ width: "min(32rem, 100%)", height: "0.85rem", marginTop: "0.5rem" }} />
            <span className="lp-pfigma-skel-block lp-pfigma-skel-hide-mobile" style={{ width: "min(28rem, 100%)", height: "0.85rem", marginTop: "0.35rem" }} />
          </div>
          <div className="lp-pfigma-stat-chips lp-pfigma-skel-hide-mobile">
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className="lp-pfigma-skel-block"
                style={{ width: "5.5rem", height: "3.25rem", borderRadius: "12px" }}
              />
            ))}
          </div>
        </header>

        <div className="lp-pfigma-toolbar">
          <span
            className="lp-pfigma-skel-block"
            style={{ width: "min(420px, 100%)", height: "2.5rem", borderRadius: "12px" }}
          />
          <span
            className="lp-pfigma-skel-block lp-pfigma-skel-hide-mobile"
            style={{ width: "6.5rem", height: "2.25rem", borderRadius: "10px" }}
          />
          <span
            className="lp-pfigma-skel-block lp-pfigma-skel-hide-mobile lp-pfigma-skel-toolbar-end"
            style={{ width: "min(420px, 100%)", height: "2.25rem", borderRadius: "10px" }}
          />
          <span
            className="lp-pfigma-skel-block lp-pfigma-skel-search-row"
            style={{ width: "100%", height: "2.75rem", borderRadius: "12px" }}
          />
        </div>

        <div className="lp-pfigma-body">
          <div className="lp-pfigma-list-wrap">
            <div className="lp-pfigma-list lp-pfigma-skel-list">
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className="lp-pfigma-skel-block lp-pfigma-skel-card"
                  style={{ width: "100%", height: "7.25rem", borderRadius: "16px", opacity: 1 - i * 0.06 }}
                />
              ))}
            </div>
          </div>
          <aside className="lp-pfigma-sidebar lp-pfigma-skel-hide-mobile">
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className="lp-pfigma-skel-block"
                style={{ width: "100%", height: i === 1 ? "14rem" : "10rem", borderRadius: "20px" }}
              />
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}
