"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LabpathLogo } from "@/components/brand/labpath-logo";
import { routes } from "@/config/routes";

type FootLink = { label: string; href: string };

type FootGroup = {
  heading: string;
  links: readonly FootLink[];
};

const FOOT_COLUMNS: readonly FootGroup[][] = [
  [
    {
      heading: "Practice",
      links: [
        { label: "Practice", href: routes.practiceHub },
        { label: "Contests", href: routes.contestHub },
        { label: "Ranking", href: routes.dashboardRanking },
        { label: "Dashboard", href: routes.dashboard },
        { label: "Paths", href: routes.paths },
      ],
    },
  ],
  [
    {
      heading: "Tracks",
      links: [
        { label: "RAG", href: `${routes.practiceHub}?track=rag` },
        { label: "Eval", href: `${routes.practiceHub}?track=eval` },
        { label: "Guardrails", href: `${routes.practiceHub}?track=guard` },
        { label: "Prompt", href: `${routes.practiceHub}?track=prompt` },
      ],
    },
  ],
  [
    {
      heading: "Resources",
      links: [
        { label: "Documentation", href: "https://github.com/Bina-Labs/Labpath" },
        { label: "Changelog", href: "https://github.com/Bina-Labs/Labpath/releases" },
        { label: "RAG demo", href: routes.demoRagWorkspace },
        { label: "Help", href: "mailto:hello@labpath.dev" },
      ],
    },
    {
      heading: "Community",
      links: [
        { label: "GitHub", href: "https://github.com/Bina-Labs/Labpath" },
        { label: "Report an issue", href: "https://github.com/Bina-Labs/Labpath/issues" },
      ],
    },
  ],
  [
    {
      heading: "Company",
      links: [
        { label: "Contact", href: routes.contact },
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
        { label: "Security", href: "/security" },
      ],
    },
    {
      heading: "Account",
      links: [
        { label: "Sign in", href: routes.signIn },
        { label: "Get started", href: routes.signUp },
      ],
    },
  ],
] as const;

const SOCIAL_LINKS = [
  {
    label: "GitHub",
    href: "https://github.com/Bina-Labs/Labpath",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com",
  },
  {
    label: "X",
    href: "https://x.com",
  },
] as const;

const BAR_LEGAL = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Use", href: "/terms" },
  { label: "Security", href: "/security" },
] as const;

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  const className = "lp-home-foot-link";
  const external =
    href.startsWith("http") || href.startsWith("mailto:");

  if (external) {
    return (
      <a
        href={href}
        className={className}
        {...(href.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function SocialIcon({ name, className }: { name: string; className?: string }) {
  const cn = className ?? "lp-home-foot-social-svg";
  if (name === "GitHub") {
    return (
      <svg className={cn} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.653 1.652.242 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .315.21.694.825.576C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
      </svg>
    );
  }
  if (name === "LinkedIn") {
    return (
      <svg className={cn} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.127 0 2.063 2.063 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    );
  }
  return (
    <svg className={cn} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function HomeLandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="lp-home-foot">
      <div className="lp-home-foot-inner">
        <div className="lp-home-foot-panel">
          <div className="lp-home-foot-grid">
            <div className="lp-home-foot-brand">
              <Link href={routes.home} className="lp-home-foot-logo-link">
                <LabpathLogo
                  size="md"
                  showWordmark
                  wordmarkClassName="lp-home-foot-wordmark"
                />
              </Link>
              <p className="lp-home-foot-desc">
                The practice platform for AI engineering teams—graded labs, hidden
                eval sets, and full traces.
              </p>
              <Link href={routes.signUp} className="lp-home-foot-cta">
                Get started
              </Link>
              <div className="lp-home-foot-trust" aria-hidden>
                <span className="lp-home-foot-trust-item">Graded runs</span>
                <span className="lp-home-foot-trust-item">Hidden test sets</span>
                <span className="lp-home-foot-trust-item">Full traces</span>
              </div>
            </div>

            {FOOT_COLUMNS.map((column, colIndex) => (
              <div key={colIndex} className="lp-home-foot-col">
                {column.map((group) => (
                  <nav
                    key={group.heading}
                    className="lp-home-foot-group"
                    aria-label={group.heading}
                  >
                    <p className="lp-home-foot-group-title">{group.heading}</p>
                    <ul className="lp-home-foot-nav-list">
                      {group.links.map((link) => (
                        <li key={link.label}>
                          <FooterLink href={link.href}>{link.label}</FooterLink>
                        </li>
                      ))}
                    </ul>
                  </nav>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="lp-home-foot-bar">
          <div className="lp-home-foot-social">
            {SOCIAL_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="lp-home-foot-social-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
              >
                <SocialIcon name={label} />
              </a>
            ))}
          </div>

          <div className="lp-home-foot-bar-end">
            {BAR_LEGAL.map((link) => (
              <Link key={link.label} href={link.href} className="lp-home-foot-bar-link">
                {link.label}
              </Link>
            ))}
            <span className="lp-home-foot-copy">© {year} LabPath</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
