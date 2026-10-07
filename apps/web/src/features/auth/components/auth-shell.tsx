import Link from "next/link";
import { LabpathLogo } from "@/components/brand/labpath-logo";
import { brand } from "@/config/brand";
import { routes } from "@/config/routes";
import { AuthHeroBeams } from "./auth-hero-beams";
import { AuthMobileTop } from "./auth-mobile-top";

type AuthShellProps = {
  children: React.ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="lc-auth-page">
      <div className="lc-auth-split">
        <aside className="lc-auth-hero" aria-label="About LabPath">
          <AuthHeroBeams />
          <Link href={routes.home} className="lc-auth-hero-brand" aria-label={brand.name}>
            <LabpathLogo size="md" showWordmark />
          </Link>
          <div className="lc-auth-hero-copy">
            <h1 className="lc-auth-hero-title">The platform for AI engineering practice</h1>
            <p className="lc-auth-hero-lead">
              Observe, evaluate, and ship agentic systems. Practice with graded simulators and
              hidden test sets—not toy demos.
            </p>
          </div>
          <div className="lc-auth-hero-trust">
            <p className="lc-auth-hero-trust-label">Built for</p>
            <ul className="lc-auth-hero-trust-list">
              <li>RAG labs</li>
              <li>Guardrails</li>
              <li>Run traces</li>
              <li>Problems</li>
            </ul>
          </div>
        </aside>

        <main className="lc-auth-main">
          <div className="lc-auth-main-glow" aria-hidden />
          <AuthMobileTop />
          <Link
            href={routes.home}
            className="lc-auth-main-brand min-[961px]:hidden"
            aria-label={brand.name}
          >
            <LabpathLogo size="sm" showWordmark />
          </Link>
          {children}
        </main>
      </div>
    </div>
  );
}
