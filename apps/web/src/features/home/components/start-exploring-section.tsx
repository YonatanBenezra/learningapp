import { routes } from "@/config/routes";
import { AuthLink } from "@/features/auth/auth-link";

function ExploreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M6 11.5V16c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5v-4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M20 10v5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13l10-6.5-10-6.5Z" />
    </svg>
  );
}

export function StartExploringSection() {
  return (
    <section className="ag-lc-explore" aria-labelledby="ag-lc-explore-title">
      <div className="ag-lc-explore-inner">
        <div>
          <div className="ag-lc-explore-head">
            <h2 id="ag-lc-explore-title" className="ag-lc-explore-title">
              Start Exploring
            </h2>
            <span className="ag-lc-explore-icon" aria-hidden="true">
              <ExploreIcon />
            </span>
          </div>
          <p className="ag-lc-explore-lead">
            Explore is a well-organized tool that helps you get the most out of LabPath by
            providing structure to guide your progress towards the next step in your AI
            engineering career.
          </p>
          <AuthLink href={routes.problems} className="ag-lc-explore-cta">
            Get Started
            <span aria-hidden="true">›</span>
          </AuthLink>
        </div>

        <div className="ag-lc-explore-art" aria-hidden="true">
          <div className="ag-lc-explore-stack">
            <div className="ag-lc-explore-sheet ag-lc-explore-sheet--yellow">
              <span />
              <span />
              <span />
            </div>
            <div className="ag-lc-explore-sheet ag-lc-explore-sheet--green">
              <span />
              <span />
            </div>
            <div className="ag-lc-explore-sheet ag-lc-explore-sheet--teal">
              <div className="ag-lc-explore-sheet-top">
                <span />
                <span />
                <span />
              </div>
              <div className="ag-lc-explore-sheet-body">
                <span />
                <span />
                <span />
              </div>
              <span className="ag-lc-explore-play">
                <PlayIcon />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
