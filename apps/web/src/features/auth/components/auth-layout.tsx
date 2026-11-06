"use client";

import type { ReactNode } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";
import { AuthModeSwitch } from "./auth-form-primitives";

const E = [0.2, 0, 0, 1] as const;
const FORM_MAX = "max-w-[640px]";

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isSignUp = pathname === routes.signUp || pathname === routes.register;

  const onBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(routes.home);
  };

  const prompt = isSignUp ? "Already have an account?" : "New to LabPath?";
  const ctaHref = isSignUp ? routes.signIn : routes.signUp;
  const ctaLabel = isSignUp ? "Sign in" : "Create account";
  const footNote = isSignUp
    ? "By continuing you agree to the Terms and Privacy Policy"
    : "Protected by rate limiting and optional 2FA";

  return (
    <div className="relative flex min-h-dvh flex-col bg-[#101927] font-[family-name:var(--font-inter,sans-serif)] text-[#F4F4F4]">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(159,239,0,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(159,239,0,0.035) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 top-0 h-72 w-72 rounded-full bg-[#9FEF00]/8 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className={cn("w-full", FORM_MAX)}>
          <button
            type="button"
            onClick={onBack}
            className={cn(
              "mb-8 inline-flex h-10 items-center gap-2 rounded-[4px] px-3 text-sm font-semibold text-[#F4F4F4]",
              "border border-[#3A4559] bg-[#242F40]/90 transition-colors hover:border-[#526177] hover:bg-[#2A3547]",
            )}
          >
            <ArrowLeft className="size-4" strokeWidth={2.25} aria-hidden />
            Back
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: E }}
            >
              {children}
            </motion.div>
          </AnimatePresence>

          <AuthModeSwitch prompt={prompt} href={ctaHref} label={ctaLabel} className="mt-6" />

          <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-[#526177]">
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {footNote}
          </p>
        </div>
      </div>
    </div>
  );
}
