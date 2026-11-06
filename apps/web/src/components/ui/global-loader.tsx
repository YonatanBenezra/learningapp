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

function LoaderDocument({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 56"
      className={className}
      aria-hidden
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 4h22l10 10v40a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
        className="lp-loader-doc-sheet"
      />
      <path d="M30 4v10h10" className="lp-loader-doc-fold" />
      <rect x="12" y="22" width="20" height="2.5" rx="1.25" className="lp-loader-doc-line" />
      <rect x="12" y="29" width="16" height="2.5" rx="1.25" className="lp-loader-doc-line" />
      <rect x="12" y="36" width="22" height="2.5" rx="1.25" className="lp-loader-doc-line" />
      <rect x="12" y="43" width="14" height="2.5" rx="1.25" className="lp-loader-doc-line" />
    </svg>
  );
}

function LoaderMagnifier() {
  return (
    <svg
      viewBox="0 0 80 80"
      className="lp-loader-magnifier-svg"
      aria-hidden
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="34" cy="34" r="22" className="lp-loader-mag-ring" strokeWidth="5" />
      <path d="M50 50 L68 68" className="lp-loader-mag-handle" strokeWidth="6" strokeLinecap="round" />
      <circle cx="34" cy="34" r="14" className="lp-loader-mag-glass" />
    </svg>
  );
}

export function GlobalLoader({
  label = "Loading…",
  fullPage = false,
  contained = false,
  platform,
}: GlobalLoaderProps) {
  const usePlatform = platform ?? fullPage;

  const docs = Array.from({ length: 8 }, (_, i) => i);

  return (
    <div
      className={`lp-loader${fullPage ? " lp-loader--page" : ""}${
        contained ? " lp-loader--content" : ""
      }${usePlatform ? " lp-loader--platform" : ""}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="lp-loader-scan" aria-hidden>
        <div className="lp-loader-scan-vignette" />
        <div className="lp-loader-scan-track-wrap">
          <div className="lp-loader-scan-track">
            {docs.map((i) => (
              <LoaderDocument key={`a-${i}`} className="lp-loader-doc" />
            ))}
            {docs.map((i) => (
              <LoaderDocument key={`b-${i}`} className="lp-loader-doc" />
            ))}
          </div>
        </div>
        <div className="lp-loader-scan-lens">
          <LoaderMagnifier />
        </div>
      </div>
      {label ? <p className="lp-loader-label">{label}</p> : null}
    </div>
  );
}
