import "../progress-lc.css";

export function DashboardSkeleton() {
  return (
    <div className="lp-lc-profile lp-lc-profile--skel" aria-busy="true" aria-label="Loading dashboard">
      <div className="lp-lc-grid">
        <aside className="lp-lc-side">
          <section className="lp-lc-card lp-lc-profile-card">
            <span className="lp-lc-skel lp-lc-skel-avatar" />
            <span className="lp-lc-skel" style={{ width: "7rem", height: "1.1rem", margin: "0.75rem auto 0" }} />
            <span className="lp-lc-skel" style={{ width: "5rem", height: "0.75rem", margin: "0.35rem auto 0" }} />
            <div className="lp-lc-skel-row">
              <span className="lp-lc-skel" style={{ width: "4.5rem", height: "0.85rem" }} />
              <span className="lp-lc-skel" style={{ width: "4.5rem", height: "0.85rem" }} />
            </div>
            <span className="lp-lc-skel" style={{ width: "100%", height: "2.25rem", marginTop: "0.85rem" }} />
          </section>
          <section className="lp-lc-card lp-lc-stats-card">
            <span className="lp-lc-skel" style={{ width: "8rem", height: "0.9rem", marginBottom: "0.75rem" }} />
            {Array.from({ length: 4 }, (_, index) => (
              <span
                key={index}
                className="lp-lc-skel"
                style={{ width: "100%", height: "2.35rem", marginBottom: "0.45rem" }}
              />
            ))}
          </section>
          <section className="lp-lc-card lp-lc-lang-card">
            <span className="lp-lc-skel" style={{ width: "6rem", height: "0.9rem", marginBottom: "0.65rem" }} />
            <span className="lp-lc-skel" style={{ width: "100%", height: "1.5rem" }} />
            <span className="lp-lc-skel lp-lc-skel-fill" />
          </section>
        </aside>

        <div className="lp-lc-main">
          <div className="lp-lc-top-row">
            <section className="lp-lc-card lp-lc-solved-card">
              <div className="lp-lc-skel-ring" />
              <div className="lp-lc-skel-bars">
                {Array.from({ length: 3 }, (_, index) => (
                  <span
                    key={index}
                    className="lp-lc-skel"
                    style={{ width: "100%", height: "1.65rem" }}
                  />
                ))}
              </div>
            </section>
            <section className="lp-lc-card lp-lc-badge-card">
              <span className="lp-lc-skel" style={{ width: "5rem", height: "0.85rem" }} />
              <span className="lp-lc-skel" style={{ width: "100%", height: "4.5rem", marginTop: "0.65rem" }} />
            </section>
          </div>

          <section className="lp-lc-card lp-lc-heat-card">
            <div className="lp-lc-skel-heat-head">
              <span className="lp-lc-skel" style={{ width: "14rem", height: "0.95rem" }} />
              <span className="lp-lc-skel" style={{ width: "9rem", height: "0.85rem" }} />
            </div>
            <div className="lp-lc-skel-heat-grid">
              {Array.from({ length: 52 }, (_, index) => (
                <span key={index} className="lp-lc-skel lp-lc-skel-heat-cell" />
              ))}
            </div>
          </section>

          <section className="lp-lc-card lp-lc-list-card">
            <div className="lp-lc-skel-tabs">
              <span className="lp-lc-skel" style={{ width: "5.5rem", height: "2rem" }} />
              <span className="lp-lc-skel" style={{ width: "3.5rem", height: "2rem" }} />
              <span className="lp-lc-skel" style={{ width: "4rem", height: "2rem" }} />
            </div>
            {Array.from({ length: 4 }, (_, index) => (
              <span
                key={index}
                className="lp-lc-skel"
                style={{ width: "100%", height: "3.25rem", marginTop: "0.55rem" }}
              />
            ))}
            <span className="lp-lc-skel lp-lc-skel-fill" />
          </section>
        </div>
      </div>
    </div>
  );
}
