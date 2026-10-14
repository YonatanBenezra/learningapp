"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { routes } from "@/config/routes";
import { AuthBrandPanel } from "./auth-brand-panel";
import { AuthMobileHero } from "./auth-mobile-hero";
import "../auth-figma.css";

const E = [0.2, 0, 0, 1] as const;

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  const pathname = usePathname();
  const isSignUp = pathname === routes.signUp || pathname === routes.register;

  const prompt = isSignUp ? "Already have an account?" : "New to LabPath?";
  const ctaHref = isSignUp ? routes.signIn : routes.signUp;
  const ctaLabel = isSignUp ? "Sign in" : "Create account";
  const footNote = isSignUp
    ? "By continuing you agree to the Terms and Privacy Policy"
    : "Protected by rate limiting and 2FA (optional)";

  return (
    <div className="lp-auth-figma">
      <AuthBrandPanel />
      <AuthMobileHero />

      <div className="lp-auth-figma-form-panel">
        <div className="lp-auth-figma-form-top lp-auth-figma-form-top--desktop">
          <span>{prompt}</span>
          <Link href={ctaHref} className="lp-auth-figma-form-top-btn">
            {ctaLabel}
          </Link>
        </div>

        <div className="lp-auth-figma-form-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              className="lp-auth-figma-form-col"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25, ease: E }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="lp-auth-figma-form-switch lp-auth-figma-form-switch--mobile">
          <span>{prompt}</span>{" "}
          <Link href={ctaHref} className="lp-auth-figma-form-switch-link">
            {ctaLabel}
          </Link>
        </p>

        <p className="lp-auth-figma-foot lp-auth-figma-foot--desktop">
          <Lock size={12} aria-hidden />
          {footNote}
        </p>
      </div>
    </div>
  );
}
