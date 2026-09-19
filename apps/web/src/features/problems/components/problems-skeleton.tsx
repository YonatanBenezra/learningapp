export function ProblemsSkeleton() {
  return (
    <div className="lp-cat lp-cat-skel" aria-hidden="true" aria-busy="true">
      <header className="lp-cat-hero">
        <div className="lp-cat-hero-copy">
          <div className="lp-cat-title-row">
            <span className="lp-skel-block" style={{ width: "7.5rem", height: "2rem" }} />
            <span className="lp-skel-block" style={{ width: "5.5rem", height: "1.35rem" }} />
          </div>
          <span
            className="lp-skel-block"
            style={{ width: "min(28rem, 100%)", height: "0.7rem", marginTop: "0.65rem" }}
          />
          <span
            className="lp-skel-block"
            style={{ width: "min(22rem, 85%)", height: "0.7rem", marginTop: "0.4rem" }}
          />
        </div>

        <div className="lp-cat-controls">
          <span className="lp-skel-block" style={{ width: "16rem", height: "2.5rem" }} />
          <span className="lp-skel-block" style={{ width: "9.5rem", height: "2.5rem" }} />
          <span className="lp-skel-block" style={{ width: "9.5rem", height: "2.5rem" }} />
        </div>
      </header>

      <section aria-label="Loading exercises">
        <div className="lp-ex-block-head">
          <span className="lp-skel-block" style={{ width: "5.5rem", height: "1.1rem" }} />
          <div className="lp-ex-block-tools">
            <span className="lp-skel-block" style={{ width: "8.5rem", height: "0.85rem" }} />
            <span className="lp-skel-block" style={{ width: "4.6rem", height: "2.05rem" }} />
          </div>
        </div>

        <div className="lp-ex-list">
          {Array.from({ length: 8 }, (_, index) => (
            <article key={index} className="lp-ex-row lp-ex-row--skel">
              <span
                className="lp-skel-block lp-ex-row-num-skel"
                style={{ width: "1.25rem", height: "0.85rem" }}
              />
              <div className="lp-ex-row-main">
                <span
                  className="lp-skel-block"
                  style={{ width: `${48 + (index % 3) * 8}%`, height: "0.95rem" }}
                />
                <span
                  className="lp-skel-block"
                  style={{ width: `${32 + (index % 4) * 6}%`, height: "0.7rem", marginTop: "0.35rem" }}
                />
              </div>
              <div className="lp-ex-row-meta">
                <span className="lp-skel-block" style={{ width: "4.75rem", height: "1.25rem" }} />
                <span className="lp-skel-block" style={{ width: "3.1rem", height: "1.25rem" }} />
              </div>
              <span className="lp-skel-block" style={{ width: "5.25rem", height: "2.2rem" }} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
