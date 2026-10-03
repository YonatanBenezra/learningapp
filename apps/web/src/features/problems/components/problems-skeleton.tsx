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
        <div style={{ display: "flex", gap: "0.45rem" }}>
          <span className="lp-skel-block" style={{ width: "5.5rem", height: "2.15rem", borderRadius: "999px" }} />
          <span className="lp-skel-block" style={{ width: "4.5rem", height: "2.15rem", borderRadius: "999px" }} />
          <span className="lp-skel-block" style={{ width: "6.5rem", height: "2.15rem", borderRadius: "999px" }} />
        </div>
      </div>
      <div className="lp-prob-main has-sidebar">
        <span
          className="lp-skel-block"
          style={{ width: "100%", height: "18rem", borderRadius: "0.85rem" }}
        />
        <span
          className="lp-skel-block"
          style={{ width: "100%", height: "16rem", borderRadius: "0.85rem" }}
        />
      </div>
    </div>
  );
}
