"use client";

import {
  motion,
  useInView,
  useReducedMotion,
  type Transition,
} from "motion/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { routes } from "@/config/routes";

const E: Transition["ease"] = [0.2, 0, 0, 1];

const HEADING = "Prove it on data you can\u2019t see.";
const HEADING_WORDS = HEADING.split(/(\s+)/);

const DOCS_HREF = "https://github.com/Bina-Labs/Labpath";

export function HomeFinalCtaSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const introInView = useInView(sectionRef, { once: true, amount: 0.3 });
  const breatheInView = useInView(sectionRef, { once: false, amount: 0.15 });
  const reduceMotion = useReducedMotion();

  const [attentionPulse, setAttentionPulse] = useState(false);
  const [hoverPulse, setHoverPulse] = useState(false);
  const [glowPhase, setGlowPhase] = useState<"idle" | "intro" | "breathe">("idle");
  const pulsePlayed = useRef(false);

  const introActive = introInView || reduceMotion;

  useEffect(() => {
    if (!introInView || reduceMotion) return;
    setGlowPhase("intro");
    const t = window.setTimeout(() => setGlowPhase("breathe"), 1400);
    return () => window.clearTimeout(t);
  }, [introInView, reduceMotion]);

  useEffect(() => {
    if (!introInView || reduceMotion || pulsePlayed.current) return;
    const t = window.setTimeout(() => {
      pulsePlayed.current = true;
      setAttentionPulse(true);
      window.setTimeout(() => setAttentionPulse(false), 1600);
    }, 1800);
    return () => window.clearTimeout(t);
  }, [introInView, reduceMotion]);

  const runHoverPulse = useCallback(() => {
    if (reduceMotion || !pulsePlayed.current) return;
    setHoverPulse(true);
    window.setTimeout(() => setHoverPulse(false), 1600);
  }, [reduceMotion]);

  const titleWords = useMemo(
    () =>
      HEADING_WORDS.map((chunk, i) => {
        if (/^\s+$/.test(chunk)) {
          return <span key={`sp-${i}`}>{chunk}</span>;
        }
        const wordIndex = HEADING_WORDS.slice(0, i).filter((c) => !/^\s+$/.test(c)).length;
        const delay = 0.5 + wordIndex * 0.08;
        return (
          <motion.span
            key={`w-${i}`}
            className="lp-home-cta-title-word"
            initial={{
              opacity: reduceMotion ? 1 : 0,
              y: reduceMotion ? 0 : 24,
              filter: reduceMotion ? "blur(0px)" : "blur(6px)",
            }}
            animate={{
              opacity: introActive ? 1 : 0,
              y: introActive ? 0 : 24,
              filter: introActive ? "blur(0px)" : "blur(6px)",
            }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.6, ease: E, delay: introInView ? delay : 0 }
            }
          >
            {chunk}
          </motion.span>
        );
      }),
    [introActive, introInView, reduceMotion],
  );

  const primaryShadow =
    attentionPulse || hoverPulse
      ? [
          "0 8px 28px -6px rgb(255 122 69 / 30%)",
          "0 0 0 6px rgb(255 122 69 / 45%)",
          "0 8px 28px -6px rgb(255 122 69 / 30%)",
          "0 0 0 10px rgb(255 122 69 / 0%)",
          "0 8px 28px -6px rgb(255 122 69 / 30%)",
        ]
      : "0 8px 28px -6px rgb(255 122 69 / 30%)";

  return (
    <section ref={sectionRef} className="lp-home-cta-section" aria-labelledby="home-final-cta-title">
      <div className="lp-home-cta-wrap">
        <motion.div
          className="lp-home-cta-card"
          initial={{
            opacity: reduceMotion ? 1 : 0,
            y: reduceMotion ? 0 : 40,
            scale: reduceMotion ? 1 : 0.97,
          }}
          animate={{
            opacity: introActive ? 1 : 0,
            y: introActive ? 0 : 40,
            scale: introActive ? 1 : 0.97,
          }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.9, ease: E, delay: introInView ? 0.1 : 0 }
          }
        >
          <motion.div
            className="lp-home-cta-glow"
            aria-hidden
            initial={{ opacity: reduceMotion ? 1 : 0, scale: reduceMotion ? 1 : 0.6 }}
            animate={
              reduceMotion
                ? { opacity: 1, scale: 1 }
                : glowPhase === "idle"
                  ? { opacity: 0, scale: 0.6 }
                  : glowPhase === "intro"
                    ? { opacity: 1, scale: 1 }
                    : breatheInView
                      ? { opacity: 1, scale: [1, 1.12, 1] }
                      : { opacity: 1, scale: 1 }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : glowPhase === "intro"
                  ? {
                      opacity: { duration: 1, delay: 0.2, ease: "easeOut" },
                      scale: { duration: 1.2, delay: 0.2, ease: E },
                    }
                  : glowPhase === "breathe" && breatheInView
                    ? {
                        scale: {
                          duration: 3.6,
                          repeat: Infinity,
                          ease: "easeInOut",
                        },
                      }
                    : { duration: 0.3 }
            }
          />

          <div className="lp-home-cta-content">
            <motion.p
              className="lp-home-cta-eyebrow"
              initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 10 }}
              animate={{ opacity: introActive ? 1 : 0, y: introActive ? 0 : 10 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      duration: 0.65,
                      ease: E,
                      delay: introInView ? 0.4 : 0,
                      opacity: { duration: 0.56, ease: "easeOut" },
                    }
              }
            >
              YOUR FIRST SET TAKES 15 MINUTES
            </motion.p>

            <h2 id="home-final-cta-title" className="lp-home-cta-title">
              {titleWords}
            </h2>

            <motion.p
              className="lp-home-cta-lead"
              initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 12 }}
              animate={{ opacity: introActive ? 1 : 0, y: introActive ? 0 : 12 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      duration: 0.65,
                      ease: E,
                      delay: introInView ? 0.9 : 0,
                      opacity: { duration: 0.56, ease: "easeOut" },
                    }
              }
            >
              Start with RAG: chunk a help-center corpus until recall@5 clears 0.80 on the hidden
              set.
            </motion.p>

            <div className="lp-home-cta-actions">
              <motion.div
                initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 12 }}
                animate={{ opacity: introActive ? 1 : 0, y: introActive ? 0 : 12 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : {
                        duration: 0.65,
                        ease: E,
                        delay: introInView ? 1.05 : 0,
                        opacity: { duration: 0.56, ease: "easeOut" },
                      }
                }
              >
                <motion.div
                  animate={{
                    boxShadow: primaryShadow,
                  }}
                  transition={
                    attentionPulse || hoverPulse
                      ? { duration: 1.6, times: [0, 0.375, 0.625, 1, 1] }
                      : { duration: 0.2 }
                  }
                  onHoverStart={runHoverPulse}
                  style={{ display: "inline-block", borderRadius: 12 }}
                >
                  <Link href={routes.problems} className="lp-home-cta-btn-primary">
                    Open problems
                    <ArrowRight strokeWidth={2} aria-hidden />
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 12 }}
                animate={{ opacity: introActive ? 1 : 0, y: introActive ? 0 : 12 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : {
                        duration: 0.65,
                        ease: E,
                        delay: introInView ? 1.13 : 0,
                        opacity: { duration: 0.56, ease: "easeOut" },
                      }
                }
              >
                <a
                  href={DOCS_HREF}
                  className="lp-home-cta-btn-ghost"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Read the docs
                </a>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
