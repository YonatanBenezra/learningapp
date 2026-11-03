"use client";

import type { CSSProperties } from "react";
import { useEffect } from "react";
import "../dashboard-figma.css";

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

function NavLinkSkel({ w }: { w: number }) {
  return <Skel width={w} height={36} style={{ borderRadius: 8 }} />;
}

export function DashboardFigmaSkeleton() {
  useEffect(() => {
    document.documentElement.dataset.workspace = "dashboard";
    return () => {
      delete document.documentElement.dataset.workspace;
    };
  }, []);

  return (
    <div
      className="lp-dash-figma lp-dash-figma--htb lp-dash-figma-skel"
      aria-hidden="true"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <header className="lp-dash-htb-nav">
        <div className="lp-dash-htb-nav-inner">
          <div className="lp-dash-htb-nav-start">
            <Skel width={118} height={28} style={{ borderRadius: 6 }} />
            <span className="lp-dash-htb-nav-divider" aria-hidden />
            <nav className="lp-dash-htb-nav-center" aria-hidden>
              <NavLinkSkel w={88} />
              <NavLinkSkel w={92} />
              <NavLinkSkel w={96} />
              <NavLinkSkel w={100} />
            </nav>
          </div>
          <div className="lp-dash-htb-nav-actions">
            <Skel width={40} height={40} style={{ borderRadius: 8 }} />
            <Skel width={40} height={40} style={{ borderRadius: 8 }} className="max-md:hidden" />
            <Skel width={40} height={40} style={{ borderRadius: 8 }} className="max-lg:hidden" />
            <Skel width={40} height={40} circle />
          </div>
        </div>
      </header>

      <div className="lp-dash-figma-main">
        <header className="lp-dash-htb-welcome">
          <div>
            <Skel width="min(320px, 85vw)" height={42} style={{ borderRadius: 10 }} />
            <Skel width="min(480px, 92vw)" height={20} style={{ marginTop: 14, borderRadius: 6 }} />
          </div>
          <Skel width={124} height={40} style={{ borderRadius: 10, flexShrink: 0 }} />
        </header>

        <section className="lp-dash-htb-recommended" aria-hidden>
          <Skel width={200} height={26} style={{ marginBottom: 16, borderRadius: 6 }} />
          <div className="lp-dash-htb-recommended-track">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`lp-dash-htb-rec-card lp-dash-htb-rec-card--${(i - 1) % 4} flex flex-col`}
                style={{ pointerEvents: "none" }}
              >
                <Skel width={72} height={14} style={{ borderRadius: 4 }} />
                <Skel width="100%" height={18} style={{ marginTop: 12, borderRadius: 4 }} />
                <Skel width="85%" height={18} style={{ marginTop: 8, borderRadius: 4 }} />
                <Skel width={48} height={14} style={{ marginTop: "auto", borderRadius: 4 }} />
              </div>
            ))}
          </div>
        </section>

        <section className="lp-dash-htb-products" aria-hidden>
          <Skel width={120} height={26} style={{ marginBottom: 16, borderRadius: 6 }} />
          <div className="lp-dash-htb-products-grid">
            <div
              className="lp-dash-htb-product lp-dash-htb-product--academy lp-dash-htb-product--promo-academy"
              style={{ pointerEvents: "none" }}
            >
              <div className="lp-dash-htb-product-promo-body">
                <Skel width={140} height={14} />
                <Skel width="90%" height={28} style={{ marginTop: 12, borderRadius: 6 }} />
                <Skel width="100%" height={16} style={{ marginTop: 12 }} />
                <Skel width="95%" height={16} style={{ marginTop: 8 }} />
                <Skel width={100} height={36} style={{ marginTop: 20, borderRadius: 8 }} />
              </div>
            </div>
            <div
              className="lp-dash-htb-product lp-dash-htb-product--labs lp-dash-htb-product--promo-labs"
              style={{ pointerEvents: "none" }}
            >
              <div className="lp-dash-htb-product-promo-body">
                <Skel width={120} height={14} />
                <Skel width="85%" height={28} style={{ marginTop: 12, borderRadius: 6 }} />
                <Skel width="100%" height={16} style={{ marginTop: 12 }} />
                <Skel width="88%" height={16} style={{ marginTop: 8 }} />
                <Skel width={96} height={36} style={{ marginTop: 20, borderRadius: 8 }} />
              </div>
            </div>
            <div
              className="lp-dash-htb-product-side lp-dash-htb-product-side--leaderboard lp-dash-htb-product--leaderboard"
              style={{ pointerEvents: "none", minHeight: 220 }}
            >
              <div className="lp-dash-htb-product-leaderboard-body">
                <Skel width={130} height={14} />
                <Skel width={160} height={26} style={{ marginTop: 10, borderRadius: 6 }} />
                <Skel width="100%" height={14} style={{ marginTop: 12 }} />
                <Skel width={90} height={32} style={{ marginTop: 16, borderRadius: 8 }} />
              </div>
            </div>
            <div
              className="lp-dash-htb-product lp-dash-htb-product--contests lp-dash-htb-product--promo-contests"
              style={{ pointerEvents: "none" }}
            >
              <div className="lp-dash-htb-product-promo-body">
                <Skel width={150} height={14} />
                <Skel width="70%" height={28} style={{ marginTop: 12, borderRadius: 6 }} />
                <Skel width="100%" height={16} style={{ marginTop: 12 }} />
                <Skel width="92%" height={16} style={{ marginTop: 8 }} />
                <Skel width={104} height={36} style={{ marginTop: 20, borderRadius: 8 }} />
              </div>
            </div>
          </div>
        </section>

        <div className="lp-dash-figma-grid">
          <div className="lp-dash-figma-col lp-dash-figma-col--main">
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
          </div>
        </div>
      </div>
    </div>
  );
}
