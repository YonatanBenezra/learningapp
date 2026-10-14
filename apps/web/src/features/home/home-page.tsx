import { Code2, Layers, Target, Zap } from "lucide-react";
import Link from "next/link";
import { brand } from "@/config/brand";
import { routes } from "@/config/routes";
import { AuthLink } from "@/features/auth/auth-link";
import "@/features/contests/contests.css";
import "./home.css";

const TRACKS = ["RAG", "Eval", "Guard", "Prompt"] as const;

const HIGHLIGHTS = [
  {
    icon: Target,
    label: "Hidden eval sets",
    copy: "Unreleased test cases drive your score — no grade inflation from public examples.",
  },
  {
    icon: Code2,
    label: "Live simulators",
    copy: "Configure pipelines in-browser and submit runs against automated graders.",
  },
  {
    icon: Layers,
    label: "Four practice tracks",
    copy: "RAG, Eval, Guardrails, and Prompt engineering — one account, one progress graph.",
  },
] as const;

function HomeHighlights() {
  return (
    <div className="lp-ct-highlights" aria-label="Why LabPath">
      {HIGHLIGHTS.map(({ icon: Icon, label, copy }) => (
        <article key={label} className="lp-ct-highlight">
          <span className="lp-ct-highlight-icon" aria-hidden>
            <Icon className="size-[1.125rem]" strokeWidth={2} />
          </span>
          <h2 className="lp-ct-highlight-title">{label}</h2>
          <p className="lp-ct-highlight-copy">{copy}</p>
        </article>
      ))}
    </div>
  );
}

function HomeStartPanel() {
  return (
    <section className="lp-ct-panel lp-ct-panel--empty" aria-labelledby="home-start-title">
      <div className="lp-ct-panel-glow" aria-hidden />
      <span className="lp-ct-panel-icon" aria-hidden>
        <Zap className="size-7" strokeWidth={1.75} />
      </span>
      <p className="lp-ct-panel-kicker">Public beta</p>
      <h2 id="home-start-title" className="lp-ct-panel-title">
        Start your first set
      </h2>
      <p className="lp-ct-panel-lead">
        {brand.description} Hidden eval sets. A score that only moves when your work does.
      </p>
      <div className="lp-ct-panel-actions">
        <AuthLink href={routes.problems} className="lp-ct-btn">
          Open problems
        </AuthLink>
        <Link href={routes.login} className="lp-ct-btn lp-ct-btn--ghost">
          Sign in
        </Link>
      </div>
    </section>
  );
}

export function HomePage() {
  return (
    <div className="ag-page lp-app">
      <div className="lp-main lp-app-main">
        <div className="lp-page lp-page-contests lp-page-home">
          <div className="lp-ct lp-ct--idle">
            <header className="lp-ct-hero">
              <div className="lp-ct-hero-copy">
                <p className="lp-ct-kicker">Practice platform</p>
                <h1 className="lp-ct-title lp-home-title">
                  The gym for AI{" "}
                  <span className="lp-home-title-accent">engineers</span>
                </h1>
                <p className="lp-ct-lead">
                  Graded RAG engineering exercises with hidden test sets and traces. Built for
                  reps, portfolios, and hiring loops — not slide decks.
                </p>
              </div>
              <div className="lp-ct-meta">
                <span className="lp-ct-chip lp-ct-chip--brand">Public beta</span>
                <span className="lp-ct-chip">4 practice tracks · Free to start</span>
              </div>
            </header>

            <HomeHighlights />

            <div className="lp-home-tracks" aria-label="Practice tracks">
              {TRACKS.map((track) => (
                <span key={track} className="lp-ct-chip">
                  {track}
                </span>
              ))}
            </div>

            <HomeStartPanel />
          </div>
        </div>

        <footer className="lp-app-foot">
          © 2026 {brand.name}. {brand.endorsement}
        </footer>
      </div>
    </div>
  );
}
