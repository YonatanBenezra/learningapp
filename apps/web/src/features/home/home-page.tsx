import Link from "next/link";
import { brand } from "@/config/brand";
import { routes } from "@/config/routes";
import { AuthLink } from "@/features/auth/auth-link";
import { HomeNav } from "./home-nav";
import "./home.css";

function TileIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={d}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HomePage() {
  return (
    <div className="ag-page">
      <HomeNav />
      <main>
        <section className="ag-hero">
          <div className="ag-rings" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="ag-orbit" aria-hidden="true">
            <span className="ag-tile ag-tile-1">
              <TileIcon d="M4 7h16M4 12h10M4 17h7" />
            </span>
            <span className="ag-tile ag-tile-2">
              <TileIcon d="M8 7h8v10H8zM9.5 10h5M9.5 13h3.5" />
            </span>
            <span className="ag-tile ag-tile-3">
              <TileIcon d="M12 4l7 3v5c0 4.2-2.8 7.2-7 8.5C7.8 19.2 5 16.2 5 12V7l7-3z" />
            </span>
            <span className="ag-tile ag-tile-4">
              <TileIcon d="M8 8h8M8 12h5M7 16h10" />
            </span>
          </div>
          <div className="ag-hero-inner">
            <p className="ag-badge">
              <span aria-hidden="true">›</span>
              Practice platform
              <span aria-hidden="true">‹</span>
            </p>
            <h1 className="ag-title">
              The gym for AI <em>engineers</em>
            </h1>
            <p className="ag-lead">
              {brand.description} Hidden eval sets. A score that only moves when
              your work does.
            </p>
            <div className="ag-actions">
              <div className="ag-note" aria-hidden="true">
                <svg width="52" height="28" viewBox="0 0 52 28" fill="none">
                  <path
                    d="M4 22c10-2 18-12 24-16 4-2.5 10-4 18-2"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M38 3.5c4 1 8 2 10 3.5-3 .2-6.5.8-9 2.4"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
                <p>Start your first set now</p>
              </div>
              <AuthLink href={routes.catalogue} className="ag-btn ag-btn-lg ag-btn-orange">
                Open catalogue
              </AuthLink>
              <Link href={routes.login} className="ag-btn ag-btn-lg ag-btn-dark">
                Sign in
              </Link>
            </div>
            <div className="ag-trust">
              <p>
                Graded across <strong>4</strong> practice tracks
              </p>
            </div>
            <div className="ag-clients">
              <span className="ag-client">RAG</span>
              <span className="ag-client">Eval</span>
              <span className="ag-client">Guard</span>
              <span className="ag-client">Prompt</span>
            </div>
          </div>
        </section>
      </main>
      <footer className="ag-footer">
        <div className="ag-footer-inner">
          <div className="ag-cta">
            <div className="ag-cta-panel">
              <div>
                <p className="ag-cta-kicker">Let&apos;s run a set</p>
                <h2 className="ag-cta-title">Ready to open the catalogue?</h2>
                <AuthLink href={routes.catalogue} className="ag-btn ag-btn-lg ag-btn-dark">
                  Get started
                </AuthLink>
              </div>
              <div className="ag-call">
                <div className="ag-call-card">
                  <p className="ag-live">
                    <i />
                    Catalogue is live
                  </p>
                  <div className="ag-avatars">
                    <span className="ag-avatar">LP</span>
                    <span>+</span>
                    <span className="ag-avatar ag-avatar--you">You</span>
                  </div>
                  <h3>Start with Chunk It Right</h3>
                  <p>Pick a problem, submit, and read the scorecard.</p>
                  <AuthLink href={routes.catalogue} className="ag-btn ag-btn-lg ag-btn-orange">
                    Open catalogue
                  </AuthLink>
                </div>
              </div>
            </div>
          </div>

          <div className="ag-cols">
            <div>
              <p className="ag-brand-name">{brand.name}</p>
              <p className="ag-brand-copy">
                {brand.tagline}. Sets, reps, and a number that goes up.
              </p>
              <p className="ag-news-title">Get a sign-in link</p>
              <form className="ag-news" action={routes.login}>
                <input type="email" name="email" placeholder="Enter your email" />
                <button type="submit" aria-label="Continue to sign in">
                  →
                </button>
              </form>
            </div>
            <div className="ag-link-grid">
              <div>
                <p className="ag-col-title">Pages</p>
                <ul>
                  <li>
                    <Link href={routes.home}>Home</Link>
                  </li>
                  <li>
                    <AuthLink href={routes.catalogue}>Catalogue</AuthLink>
                  </li>
                  <li>
                    <AuthLink href={routes.progress}>Progress</AuthLink>
                  </li>
                  <li>
                    <Link href={routes.login}>Sign in</Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="ag-col-title">Other links</p>
                <ul>
                  <li>
                    <AuthLink href={routes.catalogue}>Exercises</AuthLink>
                  </li>
                  <li>
                    <AuthLink href={routes.progress}>Skill scores</AuthLink>
                  </li>
                  <li>
                    <Link href={routes.login}>Magic link</Link>
                  </li>
                </ul>
              </div>
            </div>
            <div>
              <p className="ag-col-title">Get in touch</p>
              <ul>
                <li>{brand.endorsement}</li>
                <li>
                  <Link href={routes.login}>Sign in to start</Link>
                </li>
                <li>
                  <AuthLink href={routes.catalogue}>Browse the catalogue</AuthLink>
                </li>
              </ul>
              <p className="ag-col-title" style={{ marginTop: "1.6rem" }}>
                Follow us on
              </p>
              <div className="ag-foot-socials" aria-hidden="true">
                <span className="ag-dot">f</span>
                <span className="ag-dot">in</span>
                <span className="ag-dot">ig</span>
                <span className="ag-dot">x</span>
              </div>
            </div>
          </div>

          <div className="ag-legal-wrap">
            <div className="ag-legal">
              <p>© 2026 {brand.name}. All rights reserved</p>
              <p>{brand.endorsement}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
