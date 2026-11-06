"use client";

import {
  motion,
  useInView,
  useReducedMotion,
  type Transition,
} from "motion/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef } from "react";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";

const E: Transition["ease"] = [0.2, 0, 0, 1];

const HEADING = "Prove it on data you can\u2019t see.";
const HEADING_WORDS = HEADING.split(/(\s+)/);

const DOCS_HREF = "https://github.com/Bina-Labs/Labpath";

export function HomeFinalCtaSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const introInView = useInView(sectionRef, { once: true, amount: 0.3 });
  const reduceMotion = useReducedMotion();

  const introActive = introInView || reduceMotion;

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

  return (
    <section
      ref={sectionRef}
      className="lp-home-cta-section lp-home-cta-section--htb"
      aria-labelledby="home-final-cta-title"
    >
      <div className="lp-home-cta-wrap">
        <motion.div
          className={cn(
            "lp-home-cta-card relative flex flex-col items-center gap-5 overflow-hidden",
            "rounded-xl border border-white/10 bg-[#111827] px-12 py-[72px] text-center shadow-sm",
            "max-md:px-6 max-md:py-12",
          )}
          initial={{
            opacity: reduceMotion ? 1 : 0,
            y: reduceMotion ? 0 : 24,
          }}
          animate={{
            opacity: introActive ? 1 : 0,
            y: introActive ? 0 : 24,
          }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.9, ease: E, delay: introInView ? 0.1 : 0 }
          }
        >
          <div className="lp-home-cta-content">
            <motion.p
              className="m-0 flex items-center justify-center gap-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9fef00]"
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
              <span className="h-[1.05em] w-[3px] shrink-0 rounded-sm bg-[#9fef00]" aria-hidden />
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
                <Link
                  href={routes.signUp}
                  className="lp-home-cta-btn-primary inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#9fef00] px-[22px] text-[15px] font-medium text-[#121c2b] no-underline shadow-sm transition-colors hover:bg-[#aced2c]"
                >
                  Open problems
                  <ArrowRight strokeWidth={2} aria-hidden />
                </Link>
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
                  className="inline-flex h-12 items-center justify-center rounded-lg px-[22px] text-[15px] font-medium text-[#8799b5] no-underline transition-colors hover:bg-white/5 hover:text-[#f4f4f4]"
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
