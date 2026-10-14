import type { CSSProperties } from "react";

type SkelProps = {
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: CSSProperties;
  circle?: boolean;
};

function Skel({ width, height, className = "", style, circle }: SkelProps) {
  return (
    <span
      className={`lp-dash-figma-skel-block${className ? ` ${className}` : ""}`}
      style={{
        width,
        height,
        borderRadius: circle ? "50%" : undefined,
        ...style,
      }}
    />
  );
}

export function DashboardFigmaSkeleton() {
  return (
    <div
      className="lp-dash-figma lp-dash-figma-skel"
      aria-hidden="true"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <header className="lp-dash-figma-nav">
        <div className="lp-dash-figma-nav-inner">
          <Skel width="min(360px, 100%)" height={36} style={{ borderRadius: 10, maxWidth: 360 }} />
          <div className="lp-dash-figma-nav-actions">
            <Skel width={72} height={36} style={{ borderRadius: 999 }} />
            <Skel width={36} height={36} circle />
          </div>
        </div>
      </header>

      <div className="lp-dash-figma-main">
        <header className="lp-dash-figma-head">
          <div>
            <Skel width={180} height={12} />
            <Skel width="min(420px, 90vw)" height={48} style={{ marginTop: 10, borderRadius: 12 }} />
            <Skel width="min(320px, 80vw)" height={16} style={{ marginTop: 10 }} />
          </div>
          <div className="lp-dash-figma-head-actions">
            <Skel width={148} height={40} style={{ borderRadius: 10 }} />
            <Skel width={168} height={40} style={{ borderRadius: 10 }} />
          </div>
        </header>

        <div className="lp-dash-figma-grid">
          <div className="lp-dash-figma-col lp-dash-figma-col--left">
            <div className="lp-dash-figma-card lp-dash-figma-card--pad-lg">
              <div className="lp-dash-figma-profile-top">
                <Skel width={64} height={64} circle />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <Skel width="70%" height={22} style={{ borderRadius: 8 }} />
                  <Skel width="55%" height={14} />
                </div>
              </div>
              <Skel width="100%" height={58} style={{ borderRadius: 14 }} />
              <div className="lp-dash-figma-profile-actions">
                <Skel width="100%" height={40} style={{ borderRadius: 10, flex: 1 }} />
                <Skel width={40} height={40} style={{ borderRadius: 10, flexShrink: 0 }} />
              </div>
            </div>

            <div className="lp-dash-figma-card">
              <Skel width={88} height={16} style={{ marginBottom: 4 }} />
              <div className="lp-dash-figma-tiles">
                {[1, 2, 3, 4].map((i) => (
                  <Skel key={i} width="100%" height={72} style={{ borderRadius: 14 }} />
                ))}
              </div>
            </div>

            <div className="lp-dash-figma-card">
              <Skel width={72} height={16} style={{ marginBottom: 8 }} />
              {[1, 2, 3, 4].map((i) => (
                <Skel key={i} width="100%" height={20} style={{ marginBottom: 10, borderRadius: 6 }} />
              ))}
            </div>

            <div className="lp-dash-figma-card lp-dash-figma-skel-hide-mobile">
              <Skel width={64} height={16} style={{ marginBottom: 12 }} />
              <Skel width="100%" height={28} style={{ marginBottom: 16, borderRadius: 8 }} />
              <Skel width="100%" height={56} style={{ borderRadius: 10 }} />
            </div>

            <Skel width="100%" height={40} style={{ borderRadius: 10 }} />
          </div>

          <div className="lp-dash-figma-col lp-dash-figma-col--right">
            <div className="lp-dash-figma-row1">
              <div className="lp-dash-figma-card lp-dash-figma-card--pad-lg lp-dash-figma-solved">
                <Skel width={72} height={16} />
                <div className="lp-dash-figma-solved-body">
                  <Skel width={132} height={132} circle className="lp-dash-figma-skel-ring" />
                  <div className="lp-dash-figma-diff-rows" style={{ flex: 1 }}>
                    {[1, 2, 3].map((i) => (
                      <Skel key={i} width="100%" height={36} style={{ borderRadius: 8 }} />
                    ))}
                  </div>
                </div>
                <Skel width={140} height={36} style={{ borderRadius: 10 }} />
              </div>

              <div className="lp-dash-figma-card lp-dash-figma-card--pad-lg lp-dash-figma-drill">
                <Skel width={100} height={16} />
                <Skel width="100%" height={120} style={{ borderRadius: 14 }} />
                <Skel width="100%" height={40} style={{ borderRadius: 10 }} />
                <Skel width={72} height={14} style={{ marginTop: 4 }} />
                <div className="lp-dash-figma-badge-slots">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skel key={i} width={40} height={40} style={{ borderRadius: 10 }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="lp-dash-figma-card lp-dash-figma-card--pad-lg">
              <Skel width={220} height={16} style={{ marginBottom: 12 }} />
              <div className="lp-dash-figma-skel-heatmap">
                {Array.from({ length: 7 * 20 }, (_, i) => (
                  <Skel key={i} width={12} height={12} style={{ borderRadius: 3 }} />
                ))}
              </div>
              <Skel width={200} height={12} style={{ marginTop: 12 }} />
            </div>

            <div className="lp-dash-figma-card lp-dash-figma-recent">
              <div className="lp-dash-figma-recent-head">
                <Skel width={240} height={34} style={{ borderRadius: 10 }} />
                <Skel width={72} height={14} className="lp-dash-figma-skel-hide-mobile" />
              </div>
              {[1, 2, 3, 4].map((i) => (
                <Skel
                  key={i}
                  width="100%"
                  height={56}
                  className="lp-dash-figma-skel-recent-row"
                  style={{ borderRadius: 0, opacity: 1 - i * 0.06 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
