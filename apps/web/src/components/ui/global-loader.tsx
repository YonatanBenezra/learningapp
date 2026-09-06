import "./global-loader.css";

type GlobalLoaderProps = {
  label?: string;
  fullPage?: boolean;
};

const DOTS = 14;

export function GlobalLoader({
  label = "Loading....",
  fullPage = false,
}: GlobalLoaderProps) {
  return (
    <div
      className={`lp-loader${fullPage ? " lp-loader--page" : ""}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="lp-loader-helix" aria-hidden="true">
        <svg viewBox="0 0 120 64" className="lp-loader-svg">
          {Array.from({ length: DOTS }, (_, index) => {
            const t = index / (DOTS - 1);
            const x = 8 + t * 104;
            const y1 = 32 + Math.sin(t * Math.PI * 2) * 18;
            const y2 = 32 + Math.sin(t * Math.PI * 2 + Math.PI) * 18;
            const r1 = 2.2 + Math.abs(Math.cos(t * Math.PI * 2)) * 1.8;
            const r2 = 2.2 + Math.abs(Math.cos(t * Math.PI * 2 + Math.PI)) * 1.8;
            return (
              <g key={index}>
                <circle
                  className="lp-loader-dot lp-loader-dot--a"
                  cx={x}
                  cy={y1}
                  r={r1}
                  style={{ animationDelay: `${index * 0.08}s` }}
                />
                <circle
                  className="lp-loader-dot lp-loader-dot--b"
                  cx={x}
                  cy={y2}
                  r={r2}
                  style={{ animationDelay: `${index * 0.08 + 0.04}s` }}
                />
              </g>
            );
          })}
        </svg>
      </div>
      {label ? <p className="lp-loader-label">{label}</p> : null}
    </div>
  );
}
