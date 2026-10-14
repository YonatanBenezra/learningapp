"use client";

import { motion, useInView, useReducedMotion, type Transition } from "motion/react";
import { useRef } from "react";

const E: Transition["ease"] = [0.2, 0, 0, 1];
const ODOMETER_EASE: Transition["ease"] = [0.16, 1, 0.3, 1];
const ODOMETER_ROW = 36;

const STATS = [
  {
    kind: "odometer" as const,
    steps: ["0", "6", "14", "21", "27", "30+"],
    label: "graded exercises",
  },
  {
    kind: "odometer" as const,
    steps: ["0", "1", "2", "3", "4"],
    label: "practice tracks",
  },
  {
    kind: "odometer" as const,
    steps: ["0%", "18%", "47%", "76%", "94%", "100%"],
    label: "hidden test sets",
  },
  {
    kind: "words" as const,
    words: ["Every", "run"],
    label: "traced and costed",
  },
] as const;

function StatOdometer({
  steps,
  active,
  cardDelay,
}: {
  steps: readonly string[];
  active: boolean;
  cardDelay: number;
}) {
  const reduceMotion = useReducedMotion();
  const finalIndex = steps.length - 1;
  const finalY = -finalIndex * ODOMETER_ROW;
  const finalLabel = steps[finalIndex] ?? "";
  const rollDelay = cardDelay + 0.2;
  const shouldRoll = active && !reduceMotion;

  return (
    <div className="lp-home-stat-value lp-home-stat-odometer" aria-label={finalLabel}>
      <span className="lp-home-stat-odometer-measure" aria-hidden>
        {finalLabel}
      </span>
      <motion.div
        className="lp-home-stat-odometer-track"
        initial={{ y: reduceMotion ? finalY : 0 }}
        animate={{ y: shouldRoll ? finalY : reduceMotion || !active ? finalY : 0 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : {
                duration: 1.3,
                ease: ODOMETER_EASE,
                delay: shouldRoll ? rollDelay : 0,
              }
        }
      >
        {steps.map((step) => (
          <span key={step} className="lp-home-stat-odometer-step">
            {step}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function StatWords({
  words,
  active,
  cardDelay,
}: {
  words: readonly string[];
  active: boolean;
  cardDelay: number;
}) {
  const reduceMotion = useReducedMotion();
  const baseDelay = cardDelay + 0.3;

  return (
    <div className="lp-home-stat-value lp-home-stat-words" aria-label={words.join(" ")}>
      {words.map((word, i) => (
        <motion.span
          key={word}
          className="lp-home-stat-word"
          initial={{
            opacity: reduceMotion ? 1 : 0,
            y: reduceMotion ? 0 : 14,
            filter: reduceMotion ? "blur(0px)" : "blur(6px)",
          }}
          animate={{
            opacity: active || reduceMotion ? 1 : 0,
            y: active || reduceMotion ? 0 : 14,
            filter: active || reduceMotion ? "blur(0px)" : "blur(6px)",
          }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: 0.5,
                  ease: E,
                  delay: active ? baseDelay + i * 0.12 : 0,
                }
          }
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
}

function StatCard({
  index,
  active,
  stat,
}: {
  index: number;
  active: boolean;
  stat: (typeof STATS)[number];
}) {
  const reduceMotion = useReducedMotion();
  const cardDelay = 0.1 + index * 0.1;
  const show = active || reduceMotion;

  return (
    <motion.article
      className="lp-home-stat-card"
      initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 20 }}
      animate={{ opacity: show ? 1 : 0, y: show ? 0 : 20 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              opacity: { duration: 0.56, ease: "easeOut", delay: active ? cardDelay : 0 },
              y: { duration: 0.7, ease: E, delay: active ? cardDelay : 0 },
            }
      }
    >
      {stat.kind === "odometer" ? (
        <StatOdometer steps={stat.steps} active={active} cardDelay={cardDelay} />
      ) : (
        <StatWords words={stat.words} active={active} cardDelay={cardDelay} />
      )}
      <p className="lp-home-stat-label">{stat.label}</p>
    </motion.article>
  );
}

export function HomeStatsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.3 });

  return (
    <section ref={sectionRef} className="lp-home-stats" aria-label="Platform stats">
      <div className="lp-home-stats-inner">
        <div className="lp-home-stats-grid">
          {STATS.map((stat, index) => (
            <StatCard key={stat.label} index={index} active={inView} stat={stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
