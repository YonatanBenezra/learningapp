export function ProblemsSkeleton() {
  return (
    <div className="lp-prob lp-cat-skel" aria-hidden="true" aria-busy="true">
      <header className="lp-prob-header">
        <span className="lp-skel-block" style={{ width: "9rem", height: "2.2rem" }} />
        <span
          className="lp-skel-block"
          style={{ width: "min(28rem, 100%)", height: "0.85rem", marginTop: "0.35rem" }}
        />
      </header>
      <div className="lp-prob-filters">
        <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
          <span
            className="lp-skel-block"
            style={{ width: "5.5rem", height: "2.15rem", borderRadius: "999px" }}
          />
          <span
            className="lp-skel-block"
            style={{ width: "4.5rem", height: "2.15rem", borderRadius: "999px" }}
          />
          <span
            className="lp-skel-block"
            style={{ width: "6.5rem", height: "2.15rem", borderRadius: "999px" }}
          />
          <span
            className="lp-skel-block"
            style={{ width: "11rem", height: "2.15rem", borderRadius: "999px", marginLeft: "auto" }}
          />
        </div>
      </div>
      <div className="lp-prob-main">
        <div className="lp-prob-table-wrap lp-prob-skel-table">
          <span className="lp-skel-block" style={{ width: "100%", height: "2rem", borderRadius: "0.35rem" }} />
          <span className="lp-skel-block" style={{ width: "92%", height: "2.75rem", borderRadius: "0.35rem" }} />
          <span className="lp-skel-block" style={{ width: "88%", height: "2.75rem", borderRadius: "0.35rem" }} />
          <span className="lp-skel-block" style={{ width: "90%", height: "2.75rem", borderRadius: "0.35rem" }} />
          <span className="lp-skel-block" style={{ width: "85%", height: "2.75rem", borderRadius: "0.35rem" }} />
          <span className="lp-skel-block" style={{ borderRadius: "0.35rem" }} />
        </div>
      </div>
    </div>
  );
}
