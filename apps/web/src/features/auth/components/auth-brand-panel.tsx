"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, FileText, Layers, Shield } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { LabpathLogoMark } from "@/components/brand/labpath-logo";
import { routes } from "@/config/routes";
import { AuthEmbeddingField } from "./auth-embedding-field";

const E = [0.2, 0, 0, 1] as const;

const CHIPS = [
  { label: "RAG labs", Icon: FileText },
  { label: "Guardrails", Icon: Shield },
  { label: "Run traces", Icon: Activity },
  { label: "Problems", Icon: Layers },
] as const;

function FadeBlock({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: E, delay }}
    >
      {children}
    </motion.div>
  );
}

export function AuthBrandPanel() {
  const reduceMotion = useReducedMotion();
  const [score] = useStateDisplay(0.86, reduceMotion);
  const [showPass, setShowPass] = useState(Boolean(reduceMotion));

  useEffect(() => {
    if (reduceMotion) setShowPass(true);
  }, [reduceMotion]);

  return (
    <aside className="lp-auth-figma-brand" aria-label="About LabPath">
      <div className="lp-auth-figma-brand-bg">
        <motion.div
          className="lp-auth-figma-brand-grid"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: E }}
        />
        <div className="lp-auth-figma-brand-wash" />
        <AuthEmbeddingField className="lp-auth-figma-embed" />
      </div>

      <div className="lp-auth-figma-brand-inner">
        <Link href={routes.home} className="lp-auth-figma-logo-row">
          <LabpathLogoMark />
          <span className="lp-auth-figma-wordmark">LabPath</span>
        </Link>

        <div className="lp-auth-figma-brand-spacer" />

        <div className="lp-auth-figma-hero-block">
          <FadeBlock delay={0}>
            <div className="lp-auth-figma-beta">
              <span className="lp-auth-figma-beta-dot" aria-hidden />
              <span className="lp-auth-figma-beta-label">PUBLIC BETA</span>
            </div>
          </FadeBlock>

          <FadeBlock delay={0.08}>
            <h1 className="lp-auth-figma-headline">
              Train on simulators.
              <br />
              Ship with{" "}
              <motion.em
                initial={reduceMotion ? false : { opacity: 0, y: 12, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.65, ease: E, delay: 0.28 }}
              >
                confidence.
              </motion.em>
            </h1>
          </FadeBlock>

          <FadeBlock delay={0.16}>
            <p className="lp-auth-figma-lead">
              Guardrails red-team levels, RAG engineering labs and hidden evaluators. The same
              graders in practice and contest mode.
            </p>
          </FadeBlock>

          <FadeBlock delay={0.24}>
            <div className="lp-auth-figma-proof">
              <div className="lp-auth-figma-proof-top">
                <span className="lp-auth-figma-proof-id">rag-001 · Chunk It Right</span>
                {showPass ? (
                  <motion.span
                    className="lp-auth-figma-pass-pill"
                    initial={reduceMotion ? false : { scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 22 }}
                  >
                    <span className="lp-auth-figma-pass-pill-dot" aria-hidden />
                    pass
                  </motion.span>
                ) : (
                  <span className="lp-auth-figma-pass-pill" style={{ visibility: "hidden" }}>
                    pass
                  </span>
                )}
              </div>
              <div className="lp-auth-figma-proof-score-row">
                <span className="lp-auth-figma-proof-score">{score.toFixed(2)}</span>
                <span className="lp-auth-figma-proof-meta">recall@5 · threshold 0.80</span>
              </div>
              <ProofMeter
                onFilled={() => {
                  if (!reduceMotion) setShowPass(true);
                }}
              />
              <p className="lp-auth-figma-proof-foot">trace · 12 spans · 3,744 tok · $0.0023</p>
            </div>
          </FadeBlock>
        </div>

        <div className="lp-auth-figma-brand-spacer" />

        <FadeBlock delay={0.32} className="lp-auth-figma-built">
          <p className="lp-auth-figma-built-label">Built for</p>
          <div className="lp-auth-figma-chips">
            {CHIPS.map(({ label, Icon }) => (
              <span key={label} className="lp-auth-figma-chip">
                <Icon size={14} aria-hidden />
                {label}
              </span>
            ))}
          </div>
        </FadeBlock>
      </div>
    </aside>
  );
}

function useStateDisplay(target: number, reduceMotion: boolean | null) {
  const [value, setValue] = useState(reduceMotion ? target : 0);
  useEffect(() => {
    if (reduceMotion) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(target * t);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduceMotion, target]);
  return [value, setValue] as const;
}

function ProofMeter({ onFilled }: { onFilled: () => void }) {
  const reduceMotion = useReducedMotion();
  const [flash, setFlash] = useState(false);

  return (
    <div className="lp-auth-figma-meter">
      <motion.span
        className="lp-auth-figma-meter-fill"
        initial={reduceMotion ? false : { scaleX: 0 }}
        animate={{ scaleX: 0.86 }}
        transition={{ duration: 0.9, ease: E, delay: 0.35 }}
        onAnimationComplete={() => {
          setFlash(true);
          onFilled();
          window.setTimeout(() => setFlash(false), 320);
        }}
      />
      <motion.span
        className="lp-auth-figma-meter-tick"
        style={{ left: "80%" }}
        animate={flash ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
        transition={{ duration: 0.32 }}
      />
    </div>
  );
}
