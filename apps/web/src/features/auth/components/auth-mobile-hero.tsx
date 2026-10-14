"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { LabpathLogoMark } from "@/components/brand/labpath-logo";
import { routes } from "@/config/routes";
import { AuthEmbeddingField } from "./auth-embedding-field";

const E = [0.2, 0, 0, 1] as const;

export function AuthMobileHero() {
  const reduceMotion = useReducedMotion();

  return (
    <header className="lp-auth-figma-mobile-hero" aria-label="LabPath">
      <div className="lp-auth-figma-mobile-hero-bg" aria-hidden>
        <div className="lp-auth-figma-brand-grid" />
        <div className="lp-auth-figma-brand-wash lp-auth-figma-mobile-hero-wash" />
        <AuthEmbeddingField className="lp-auth-figma-embed lp-auth-figma-mobile-hero-embed" />
      </div>

      <motion.div
        className="lp-auth-figma-mobile-hero-inner"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: E }}
      >
        <Link href={routes.home} className="lp-auth-figma-logo-row">
          <LabpathLogoMark />
          <span className="lp-auth-figma-wordmark">LabPath</span>
          <span className="lp-auth-figma-logo-divider" aria-hidden />
          <span className="lp-auth-figma-byline">by Bina</span>
        </Link>

        <h1 className="lp-auth-figma-headline lp-auth-figma-headline--mobile">
          Train on simulators.
          <br />
          Ship with <em>confidence.</em>
        </h1>
      </motion.div>
    </header>
  );
}
