"use client";

import { motion, useInView, useReducedMotion, type Transition } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  Database,
  ImageIcon,
  Layers,
  LineChart,
  Shield,
  TerminalSquare,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* —— Timing (seconds, t = 0 when section/card enters view) —— */
const E: Transition["ease"] = [0.2, 0, 0, 1];
const EYEBROW_DELAY = 0.1;
const TITLE_WORD_START = 0.2;
const TITLE_WORD_STAGGER = 0.1;
const DESC_DELAY = 0.34;

const TITLE = "Train like an engineer.";
const TITLE_WORDS = TITLE.split(/(\s+)/);

const STEPS: {
  step: string;
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    step: "01",
    icon: Layers,
    title: "Pick a track",
    description:
      "RAG, Eval, Guard or Prompt. Each problem states a goal, a pass threshold and what you are allowed to change.",
  },
  {
    step: "02",
    icon: TerminalSquare,
    title: "Run in the simulator",
    description:
      "Edit config or code in a real workspace. Every run is traced: chunks, prompts, tool calls, tokens, cost.",
  },
  {
    step: "03",
    icon: LineChart,
    title: "Hidden eval moves your score",
    description:
      "We grade against a test set you never see. Only better retrieval, prompts or guards move the number.",
  },
];

const TRACK_PILLS = [
  { label: "RAG", icon: Database, active: true },
  { label: "Eval", icon: BarChart3 },
  { label: "Guard", icon: Shield },
  { label: "Prompt", icon: ImageIcon },
] as const;

const TERMINAL_CMD = "$ labpath run rag-001";

const TERMINAL_LINES = [
  { text: "chunk  400 · overlap 80 · heading-aware", tone: "muted" as const },
  { text: "retrieve  top-5 · 212 chunks indexed", tone: "muted" as const },
  { text: "trace  12 spans · 3,744 tok · $0.0023", tone: "key" as const },
] as const;

const BAR_HEIGHTS = [15, 21, 30, 37, 45] as const;

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return mobile;
}

type FadeUpProps = {
  active: boolean;
  delay: number;
  y?: number;
  dur?: number;
  distScale?: number;
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
};

function FadeUp({
  active,
  delay,
  y = 24,
  dur = 0.7,
  distScale = 1,
  className,
  children,
  style,
}: FadeUpProps) {
  const reduceMotion = useReducedMotion();
  const offset = y * distScale;
  const show = reduceMotion || active;

  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : offset }}
      animate={{ opacity: show ? 1 : 0, y: show ? 0 : offset }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              opacity: { duration: 0.56, ease: "easeOut", delay: active ? delay : 0 },
              y: { duration: dur, ease: E, delay: active ? delay : 0 },
            }
      }
    >
      {children}
    </motion.div>
  );
}

function TrackVisual() {
  return (
    <div className="lp-home-hiw-visual lp-home-hiw-visual--track">
      <div className="lp-home-hiw-pills">
        <div className="lp-home-hiw-pills-row">
          {TRACK_PILLS.slice(0, 3).map((pill) => {
            const isRag = pill.label === "RAG";
            return (
              <span key={pill.label} className={`lp-home-hiw-pill${isRag ? " is-active" : ""}`}>
                <span className="lp-home-hiw-pill-dot">
                  <pill.icon className="lp-home-hiw-pill-dot-icon" strokeWidth={1.5} aria-hidden />
                </span>
                {pill.label}
              </span>
            );
          })}
        </div>
        <div className="lp-home-hiw-pills-row">
          {(() => {
            const pill = TRACK_PILLS[3];
            return (
              <span className="lp-home-hiw-pill">
                <span className="lp-home-hiw-pill-dot">
                  <pill.icon className="lp-home-hiw-pill-dot-icon" strokeWidth={1.5} aria-hidden />
                </span>
                {pill.label}
              </span>
            );
          })()}
        </div>
      </div>
      <p className="lp-home-hiw-pill-caption">rag-001 · Chunk It Right · recall@5 ≥ 0.80</p>
    </div>
  );
}

function TerminalVisual() {
  return (
    <div className="lp-home-hiw-visual lp-home-hiw-visual--terminal">
      <div className="lp-home-hiw-terminal" aria-hidden>
        <span className="lp-home-hiw-terminal-line lp-home-hiw-terminal-line--cmd">
          {TERMINAL_CMD}
        </span>
        {TERMINAL_LINES.map((line) => (
          <span
            key={line.text}
            className={`lp-home-hiw-terminal-line lp-home-hiw-terminal-line--${line.tone}`}
          >
            {line.text}
          </span>
        ))}
      </div>
    </div>
  );
}

function ScoreVisual() {
  return (
    <div className="lp-home-hiw-visual lp-home-hiw-visual--score">
      <div className="lp-home-hiw-score">
        <div className="lp-home-hiw-score-head">
          <p className="lp-home-hiw-score-label">recall@5</p>
          <div className="lp-home-hiw-score-numbers">
            <span className="lp-home-hiw-score-from">0.41</span>
            <ArrowRight className="lp-home-hiw-score-arrow" strokeWidth={1.5} aria-hidden />
            <span className="lp-home-hiw-score-to">0.86</span>
          </div>
        </div>
        <div className="lp-home-hiw-bars" aria-hidden>
          {BAR_HEIGHTS.map((h, k) => (
            <span
              key={k}
              className={`lp-home-hiw-bar${k === BAR_HEIGHTS.length - 1 ? " is-teal" : ""}`}
              style={{ height: h }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function HowItWorksCard({ index, step }: { index: number; step: (typeof STEPS)[number] }) {
  const Icon = step.icon;

  return (
    <article
      className={cn(
        "box-border flex min-h-[400px] flex-col gap-5 rounded-lg border border-white/10",
        "bg-[#111827] p-10 shadow-sm max-md:min-h-0 max-md:p-7",
      )}
    >
      <div className="lp-home-hiw-card-top">
        <span className="lp-home-hiw-step">{step.step}</span>
        <span className="lp-home-hiw-icon-box">
          <Icon className="lp-icon" strokeWidth={1.5} aria-hidden />
        </span>
      </div>

      {index === 0 ? <TrackVisual /> : null}
      {index === 1 ? <TerminalVisual /> : null}
      {index === 2 ? <ScoreVisual /> : null}

      <h3 className="lp-home-hiw-card-title">{step.title}</h3>
      <div className="lp-home-hiw-card-desc-wrap">
        <p className="lp-home-hiw-card-desc">{step.description}</p>
      </div>
    </article>
  );
}

export function HomeHowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const sectionInView = useInView(sectionRef, { once: true, amount: 0.25 });
  const reduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const distScale = isMobile ? 0.7 : 1;

  const headerActive = sectionInView;

  const titleWordNodes = useMemo(
    () =>
      TITLE_WORDS.map((chunk, i) => {
        if (/^\s+$/.test(chunk)) {
          return <span key={`sp-${i}`}>{chunk}</span>;
        }
        const wordIndex = TITLE_WORDS.slice(0, i).filter((c) => !/^\s+$/.test(c)).length;
        const delay = TITLE_WORD_START + wordIndex * TITLE_WORD_STAGGER;
        return (
          <motion.span
            key={`w-${i}-${chunk}`}
            className="lp-home-hiw-title-word"
            initial={{
              opacity: reduceMotion ? 1 : 0,
              y: reduceMotion ? 0 : 22 * distScale,
              filter: reduceMotion ? "blur(0px)" : "blur(6px)",
            }}
            animate={{
              opacity: headerActive || reduceMotion ? 1 : 0,
              y: headerActive || reduceMotion ? 0 : 22 * distScale,
              filter: headerActive || reduceMotion ? "blur(0px)" : "blur(6px)",
            }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    duration: 0.6,
                    ease: E,
                    delay: headerActive ? delay : 0,
                  }
            }
          >
            {chunk}
          </motion.span>
        );
      }),
    [headerActive, reduceMotion, distScale],
  );

  return (
    <section
      ref={sectionRef}
      className="lp-home-hiw lp-home-hiw--htb"
      aria-labelledby="home-hiw-title"
    >
      <div className="lp-home-hiw-inner">
        <header className="lp-home-hiw-header">
          <FadeUp
            active={headerActive}
            delay={EYEBROW_DELAY}
            y={14}
            distScale={distScale}
            className="lp-home-hiw-eyebrow"
          >
            HOW IT WORKS
          </FadeUp>
          <h2 id="home-hiw-title" className="lp-home-hiw-title">
            {titleWordNodes}
          </h2>
          <FadeUp
            active={headerActive}
            delay={DESC_DELAY}
            y={14}
            distScale={distScale}
            className="lp-home-hiw-lead"
          >
            Three steps, the same loop you run at work: pick a problem, ship a pipeline, let a
            hidden eval decide.
          </FadeUp>
        </header>

        <div className="lp-home-hiw-grid">
          {STEPS.map((step, index) => (
            <HowItWorksCard key={step.step} index={index} step={step} />
          ))}
        </div>
      </div>
    </section>
  );
}
