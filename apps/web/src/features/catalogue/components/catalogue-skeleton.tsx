export function CatalogueSkeleton() {
  return (
    <div className="lp-cat lp-cat-skel" aria-hidden="true">
      <header className="lp-cat-hero">
        <div className="lp-cat-hero-copy">
          <span
            className="lp-skel-block"
            style={{ width: "11rem", height: "2rem" }}
          />
          <span
            className="lp-skel-block"
            style={{ width: "min(24rem, 100%)", height: "0.7rem", marginTop: "0.55rem" }}
          />
        </div>
        <div className="lp-cat-controls">
          <span className="lp-skel-block" style={{ width: "16rem", height: "2.5rem" }} />
          <span className="lp-skel-block" style={{ width: "9.5rem", height: "2.5rem" }} />
          <span className="lp-skel-block" style={{ width: "9.5rem", height: "2.5rem" }} />
        </div>
      </header>

      <div className="lp-path-rail">
        {Array.from({ length: 2 }, (_, index) => (
          <article key={index} className="lp-path-card">
            <span className="lp-skel-block" style={{ width: "3rem", height: "0.7rem" }} />
            <span className="lp-skel-block" style={{ width: "100%", height: "3px" }} />
            <span className="lp-skel-block" style={{ width: "65%", height: "1rem" }} />
            <span className="lp-skel-block" style={{ width: "90%", height: "0.7rem" }} />
          </article>
        ))}
      </div>

      <div className="lp-ex-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <article key={index} className="lp-ex-card">
            <span className="lp-skel-block" style={{ width: "7rem", height: "1.1rem" }} />
            <span className="lp-skel-block" style={{ width: "70%", height: "1rem" }} />
            <span className="lp-skel-block" style={{ width: "50%", height: "0.7rem" }} />
            <span className="lp-skel-block" style={{ width: "100%", height: "2.2rem" }} />
          </article>
        ))}
      </div>
    </div>
  );
}
