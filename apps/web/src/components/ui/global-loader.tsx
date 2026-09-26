import "./global-loader.css";

type GlobalLoaderProps = {
  label?: string;
  /** Fixed overlay over the whole viewport. Only for screens with no shell yet. */
  fullPage?: boolean;
  /** Fills the content area instead, so a persistent shell stays visible. */
  contained?: boolean;
};

export function GlobalLoader({
  label = "Loading",
  fullPage = false,
  contained = false,
}: GlobalLoaderProps) {
  return (
    <div
      className={`lp-loader${fullPage ? " lp-loader--page" : ""}${
        contained ? " lp-loader--content" : ""
      }`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="lp-loader-shell" aria-hidden="true">
        <svg viewBox="0 0 48 48" className="lp-loader-svg">
          <circle className="lp-loader-track" cx="24" cy="24" r="20" />
          <circle className="lp-loader-arc" cx="24" cy="24" r="20" />
        </svg>
      </div>
      {label ? <p className="lp-loader-label">{label}</p> : null}
    </div>
  );
}
