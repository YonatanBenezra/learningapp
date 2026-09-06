export function PathStripSkeleton() {
  return (
    <section className="lp-path-strip lp-cat-skel" aria-hidden="true">
      <div className="lp-path-strip-head">
        <span className="lp-skel-block" style={{ width: "7.5rem", height: "0.95rem" }} />
        <span className="lp-skel-block" style={{ width: "11rem", height: "0.75rem" }} />
      </div>
      <div className="lp-path-rail">
        {Array.from({ length: 2 }, (_, index) => (
          <article key={index} className="lp-path-card">
            <span className="lp-skel-block" style={{ width: "3rem", height: "0.7rem" }} />
            <span className="lp-skel-block" style={{ width: "100%", height: "3px" }} />
            <span className="lp-skel-block" style={{ width: "70%", height: "1rem" }} />
            <span className="lp-skel-block" style={{ width: "92%", height: "0.7rem" }} />
            <span className="lp-skel-block" style={{ width: "6rem", height: "2.15rem" }} />
          </article>
        ))}
      </div>
    </section>
  );
}
