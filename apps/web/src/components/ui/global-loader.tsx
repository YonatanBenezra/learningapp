import "./global-loader.css";

type GlobalLoaderProps = {
  label?: string;
  /** Fixed overlay over the whole viewport. Only for screens with no shell yet. */
  fullPage?: boolean;
  /** Fills the content area instead, so a persistent shell stays visible. */
  contained?: boolean;
  /** Dark HTB workspace styling (#101927, lime accent). Default on fullPage. */
  platform?: boolean;
};

export function GlobalLoader({
  label = "Loading…",
  fullPage = false,
  contained = false,
  platform,
}: GlobalLoaderProps) {
  const usePlatform = platform ?? fullPage;

  return (
    <div
      className={`lp-loader${fullPage ? " lp-loader--page" : ""}${
        contained ? " lp-loader--content" : ""
      }${usePlatform ? " lp-loader--platform" : ""}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="lp-loader-mark" aria-hidden>
        <span className="lp-loader-beam" />
        <div className="lp-loader-pulse">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="lp-loader-rail" aria-hidden />
      {label ? <p className="lp-loader-label">{label}</p> : null}
    </div>
  );
}
