"use client";

import { AnimatePresence, motion, useInView, useReducedMotion, type Transition } from "motion/react";
import { ArrowRight, Check, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState, type FormEvent, type ReactNode } from "react";
import { LabpathLogoMark } from "@/components/brand/labpath-logo";
import { brand } from "@/config/brand";
import { routes } from "@/config/routes";

const E: Transition["ease"] = [0.2, 0, 0, 1];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FOOT_NAV = [
  {
    label: "Product",
    links: [
      { label: "Problems", href: routes.problems },
      { label: "Contest", href: routes.contests },
      { label: "Leaderboard", href: routes.leaderboard },
      { label: "Changelog", href: "https://github.com/Bina-Labs/Labpath/releases" },
    ],
  },
  {
    label: "Tracks",
    links: [
      { label: "RAG", href: `${routes.problems}?track=rag` },
      { label: "Eval", href: `${routes.problems}?track=eval` },
      { label: "Guard", href: `${routes.problems}?track=guard` },
      { label: "Prompt", href: `${routes.problems}?track=prompt` },
    ],
  },
  {
    label: "Company",
    links: [
      { label: "About Bina", href: "https://bina.inc" },
      { label: "Docs", href: "https://github.com/Bina-Labs/Labpath" },
      { label: "Contact", href: "mailto:hello@labpath.dev" },
    ],
  },
] as const;

const LEGAL_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Security", href: "/security" },
] as const;

function FadeUpBlock({
  show,
  delay,
  children,
  className,
}: {
  show: boolean;
  delay: number;
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const visible = show || reduceMotion;

  return (
    <motion.div
      className={className}
      initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 16 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 16 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              duration: 0.6,
              ease: E,
              delay: show ? delay : 0,
              opacity: { duration: 0.56, ease: "easeOut", delay: show ? delay : 0 },
            }
      }
    >
      {children}
    </motion.div>
  );
}

function FooterLink({
  href,
  children,
  external,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  const className = "lp-home-foot-link";
  if (external || href.startsWith("http") || href.startsWith("mailto:")) {
    return (
      <a
        href={href}
        className={className}
        {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
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

function StatusPill({ pingActive }: { pingActive: boolean }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="lp-home-foot-status" role="status">
      <span className="lp-home-foot-status-dot-wrap" aria-hidden>
        <span className="lp-home-foot-status-dot" />
        {pingActive && !reduceMotion ? (
          <motion.span
            className="lp-home-foot-status-ping"
            animate={{ scale: [1, 2.4], opacity: [0.5, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          />
        ) : null}
      </span>
      Graders online
    </div>
  );
}

export function HomeLandingFooter() {
  const footerRef = useRef<HTMLElement>(null);
  const inView = useInView(footerRef, { once: true, amount: 0.2 });
  const pingInView = useInView(footerRef, { once: false, amount: 0.1 });
  const reduceMotion = useReducedMotion();

  const [email, setEmail] = useState("");
  const [formState, setFormState] = useState<"idle" | "error" | "loading" | "success">("idle");
  const [shake, setShake] = useState(false);

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (formState === "loading" || formState === "success") return;

      const value = email.trim();
      if (!EMAIL_RE.test(value)) {
        setFormState("error");
        setShake(true);
        window.setTimeout(() => setShake(false), 350);
        return;
      }

      setFormState("loading");
      window.setTimeout(() => setFormState("success"), 600);
    },
    [email, formState],
  );

  return (
    <footer ref={footerRef} className="lp-home-foot">
      <div className="lp-home-foot-inner">
        <div className="lp-home-foot-top">
          <FadeUpBlock show={inView} delay={0} className="lp-home-foot-brand">
            <div className="lp-home-foot-logo-row">
              <LabpathLogoMark />
              <span className="lp-home-foot-wordmark">{brand.name}</span>
              <span className="lp-home-foot-divider" aria-hidden />
              <span className="lp-home-foot-endorse">{brand.endorsement}</span>
            </div>
            <p className="lp-home-foot-desc">
              Practice platform for AI engineering. Graded exercises, hidden eval sets and full
              traces.
            </p>
            <p className="lp-home-foot-signup-label">Get started</p>
            <div className="lp-home-foot-form-wrap">
              <AnimatePresence mode="wait" initial={false}>
                {formState === "success" ? (
                  <motion.div
                    key="success"
                    className="lp-home-foot-success"
                    initial={{ opacity: reduceMotion ? 1 : 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.2 }}
                    aria-live="polite"
                  >
                    <span className="lp-home-foot-success-icon">
                      <Check strokeWidth={2.5} aria-hidden />
                    </span>
                    <span className="lp-home-foot-success-text">
                      You&apos;re on the list — check your inbox.
                    </span>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    className={`lp-home-foot-form${formState === "error" ? " is-error" : ""}`}
                    onSubmit={onSubmit}
                    animate={shake ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                    transition={{ duration: 0.35 }}
                    initial={{ opacity: reduceMotion ? 1 : 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <label htmlFor="home-foot-email" className="lp-home-foot-sr">
                      Email address
                    </label>
                    <Mail className="lp-home-foot-form-icon" strokeWidth={1.75} aria-hidden />
                    <input
                      id="home-foot-email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      className="lp-home-foot-input"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (formState === "error") setFormState("idle");
                      }}
                      disabled={formState === "loading"}
                    />
                    <button
                      type="submit"
                      className="lp-home-foot-submit"
                      disabled={formState === "loading"}
                      aria-label="Get started"
                    >
                      {formState === "loading" ? (
                        <Loader2 className="lp-home-foot-submit-spinner" strokeWidth={2.5} aria-hidden />
                      ) : (
                        <>
                          <span className="lp-home-foot-submit-label">Get started</span>
                          <ArrowRight strokeWidth={2} aria-hidden />
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
              {formState === "error" ? (
                <p className="lp-home-foot-form-error" role="alert">
                  Enter a valid email
                </p>
              ) : null}
            </div>
          </FadeUpBlock>

          <span className="lp-home-foot-spacer" aria-hidden />

          <div className="lp-home-foot-links-row">
            {FOOT_NAV.map((col, i) => (
              <FadeUpBlock key={col.label} show={inView} delay={0.08 + i * 0.06}>
                <nav className="lp-home-foot-nav" aria-label={col.label}>
                  <p className="lp-home-foot-nav-title">{col.label}</p>
                  <ul className="lp-home-foot-nav-list">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <FooterLink href={link.href} external={link.href.startsWith("http")}>
                          {link.label}
                        </FooterLink>
                      </li>
                    ))}
                  </ul>
                </nav>
              </FadeUpBlock>
            ))}
          </div>
        </div>

        <FadeUpBlock show={inView} delay={0.3} className="lp-home-foot-legal">
          <span className="lp-home-foot-copy">© 2026 Bina</span>
          <div className="lp-home-foot-legal-links">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className="lp-home-foot-legal-link">
                {link.label}
              </Link>
            ))}
          </div>
          <StatusPill pingActive={pingInView} />
        </FadeUpBlock>
      </div>
    </footer>
  );
}
