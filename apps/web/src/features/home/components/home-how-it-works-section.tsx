"use client";

import {
  animate,
  motion,
  useInView,
  useReducedMotion,
  type Transition,
} from "motion/react";
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
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

/* —— Timing (seconds, t = 0 when section/card enters view) —— */
const E: Transition["ease"] = [0.2, 0, 0, 1];
const EASE_BACK: Transition["ease"] = [0.34, 1.56, 0.64, 1];

const EYEBROW_DELAY = 0.1;
const TITLE_WORD_START = 0.2;
const TITLE_WORD_STAGGER = 0.1;
const DESC_DELAY = 0.34;

const CARD_START = 0.45;
const CARD_STAGGER = 0.14;
const VISUAL_BASE = 1.1;
const VISUAL_STAGGER = 0.15;

const INTRO_HOVER_UNLOCK_S = 3.5;

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

function TrackVisual({
  active,
  visualStart,
  distScale,
}: {
  active: boolean;
  visualStart: number;
  distScale: number;
}) {
  const reduceMotion = useReducedMotion();
  const show = reduceMotion || active;

  const renderPill = (pill: (typeof TRACK_PILLS)[number], k: number) => {
    const pillDelay = visualStart + k * 0.09;
    const isRag = pill.label === "RAG";
    return (
            <motion.span
              key={pill.label}
              className={`lp-home-hiw-pill${isRag ? " is-active" : ""}`}
              initial={{
                opacity: reduceMotion ? 1 : 0,
                scale: reduceMotion ? 1 : 0.7,
                y: 0,
              }}
              animate={{
                opacity: show ? 1 : 0,
                scale: show ? 1 : 0.7,
                y:
                  isRag && show && active && !reduceMotion
                    ? [0, -4, 0]
                    : 0,
                boxShadow:
                  isRag && show && active && !reduceMotion
                    ? [
                        "0 0 0 0 rgba(255,122,69,0)",
                        "0 0 0 6px rgba(255,122,69,0.28)",
                        "0 0 0 0 rgba(255,122,69,0)",
                      ]
                    : "0 0 0 0 rgba(255,122,69,0)",
              }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      opacity: { duration: 0.25, delay: active ? pillDelay : 0 },
                      scale: {
                        duration: 0.5,
                        ease: EASE_BACK,
                        delay: active ? pillDelay : 0,
                      },
                      y: isRag
                        ? {
                            delay: 2.2,
                            duration: 0.45,
                            ease: "easeOut",
                            times: [0, 0.45, 1],
                          }
                        : { duration: 0 },
                      boxShadow: isRag
                        ? { delay: 2.2, duration: 0.6, ease: "easeOut" }
                        : { duration: 0 },
                    }
              }
            >
              <span className="lp-home-hiw-pill-dot">
                <pill.icon className="lp-home-hiw-pill-dot-icon" strokeWidth={1.5} aria-hidden />
              </span>
              {pill.label}
            </motion.span>
    );
  };

  return (
    <div className="lp-home-hiw-visual lp-home-hiw-visual--track">
      <div className="lp-home-hiw-pills">
        <div className="lp-home-hiw-pills-row">
          {TRACK_PILLS.slice(0, 3).map((pill, k) => renderPill(pill, k))}
        </div>
        <div className="lp-home-hiw-pills-row">
          {renderPill(TRACK_PILLS[3], 3)}
        </div>
      </div>
      <FadeUp
        active={active}
        delay={visualStart + 0.5}
        y={6}
        dur={0.5}
        distScale={distScale}
        className="lp-home-hiw-pill-caption-wrap"
      >
        <p className="lp-home-hiw-pill-caption">
          rag-001 · Chunk It Right · recall@5 ≥ 0.80
        </p>
      </FadeUp>
    </div>
  );
}

function TerminalVisual({
  active,
  visualStart,
  replayToken,
}: {
  active: boolean;
  visualStart: number;
  replayToken: number;
}) {
  const reduceMotion = useReducedMotion();
  const terminalRef = useRef<HTMLDivElement>(null);
  const cursorInView = useInView(terminalRef, { amount: 0.2, once: false });
  const [typedCmd, setTypedCmd] = useState(reduceMotion ? TERMINAL_CMD : "");
  const [visibleLines, setVisibleLines] = useState(reduceMotion ? 3 : 0);
  const inView = active;
  const lineInterval = 0.35;

  useEffect(() => {
    if (reduceMotion) {
      setTypedCmd(TERMINAL_CMD);
      setVisibleLines(3);
      return;
    }
    setTypedCmd("");
    setVisibleLines(0);
    if (!inView) {
      return;
    }

    const timers: number[] = [];
    const cmd = TERMINAL_CMD;
    let charIndex = 0;

    const typeChar = () => {
      charIndex += 1;
      setTypedCmd(cmd.slice(0, charIndex));
      if (charIndex < cmd.length) {
        timers.push(window.setTimeout(typeChar, 28));
      }
    };

    timers.push(window.setTimeout(typeChar, visualStart * 1000));

    for (let k = 1; k <= TERMINAL_LINES.length; k += 1) {
      timers.push(
        window.setTimeout(
          () => setVisibleLines((n) => Math.max(n, k)),
          (visualStart + k * lineInterval) * 1000,
        ),
      );
    }

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [inView, visualStart, replayToken, reduceMotion]);

  const cursorStart = visualStart + 3 * lineInterval;
  const showCursor =
    reduceMotion ? inView : inView && visibleLines >= 3 && cursorInView;

  return (
    <div ref={terminalRef} className="lp-home-hiw-visual lp-home-hiw-visual--terminal">
      <div className="lp-home-hiw-terminal" aria-hidden>
        <motion.span
          className="lp-home-hiw-terminal-line lp-home-hiw-terminal-line--cmd"
          initial={{ opacity: reduceMotion ? 1 : 0, x: reduceMotion ? 0 : -6 }}
          animate={{
            opacity: inView || reduceMotion ? 1 : 0,
            x: inView || reduceMotion ? 0 : -6,
          }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { x: { duration: 0.25, ease: "easeOut", delay: visualStart } }
          }
        >
          {typedCmd}
        </motion.span>
        {TERMINAL_LINES.map((line, idx) => {
          const k = idx + 1;
          const lineVisible = visibleLines >= k || reduceMotion;
          return (
            <motion.span
              key={line.text}
              className={`lp-home-hiw-terminal-line lp-home-hiw-terminal-line--${line.tone}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{
                opacity: lineVisible && (inView || reduceMotion) ? 1 : 0,
                x: lineVisible && (inView || reduceMotion) ? 0 : -6,
              }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { x: { duration: 0.25, ease: "easeOut" } }
              }
            >
              {line.text}
            </motion.span>
          );
        })}
        {showCursor ? (
          <motion.span
            className="lp-home-hiw-terminal-cursor"
            initial={{ opacity: 1 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: [1, 0] }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    delay: cursorStart,
                    duration: 0.5,
                    repeat: Infinity,
                    repeatType: "mirror",
                    ease: "linear",
                  }
            }
          />
        ) : null}
      </div>
    </div>
  );
}

function ScoreVisual({
  active,
  visualStart,
  replayToken,
}: {
  active: boolean;
  visualStart: number;
  replayToken: number;
}) {
  const reduceMotion = useReducedMotion();
  const [displayScore, setDisplayScore] = useState("0.41");
  const show = reduceMotion || active;

  useEffect(() => {
    if (!show) {
      return;
    }
    if (reduceMotion) {
      setDisplayScore("0.86");
      return;
    }
    setDisplayScore("0.41");
    const controls = animate(0.41, 0.86, {
      delay: visualStart + 0.5,
      duration: 0.9,
      ease: E,
      onUpdate: (v) => setDisplayScore(v.toFixed(2)),
    });
    return () => controls.stop();
  }, [show, visualStart, replayToken, reduceMotion]);

  return (
    <div className="lp-home-hiw-visual lp-home-hiw-visual--score">
      <div className="lp-home-hiw-score">
        <FadeUp active={active} delay={visualStart + 0.4} y={10} dur={0.6} distScale={1}>
          <div className="lp-home-hiw-score-head">
            <p className="lp-home-hiw-score-label">recall@5</p>
            <div className="lp-home-hiw-score-numbers">
              <span className="lp-home-hiw-score-from">0.41</span>
              <ArrowRight className="lp-home-hiw-score-arrow" strokeWidth={1.5} aria-hidden />
              <span className="lp-home-hiw-score-to">{displayScore}</span>
            </div>
          </div>
        </FadeUp>
        <div className="lp-home-hiw-bars" aria-hidden>
          {BAR_HEIGHTS.map((h, k) => {
            const isTeal = k === BAR_HEIGHTS.length - 1;
            const barDelay = visualStart + k * 0.12;
            const scaleFrom = 2 / h;
            return (
              <motion.span
                key={k}
                className={`lp-home-hiw-bar${isTeal ? " is-teal" : ""}`}
                style={{ height: h }}
                initial={{
                  scaleY: reduceMotion ? 1 : scaleFrom,
                  opacity: reduceMotion ? 1 : isTeal ? 1 : 0.85,
                }}
                animate={{
                  scaleY: show ? 1 : scaleFrom,
                  opacity: show ? 1 : 0.85,
                  ...(isTeal && show && !reduceMotion
                    ? { opacity: [1, 0.55, 1, 0.55, 1] }
                    : {}),
                }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : isTeal
                      ? {
                          scaleY: {
                            delay: active ? barDelay : 0,
                            duration: 0.7,
                            ease: EASE_BACK,
                          },
                          opacity: {
                            delay: active ? visualStart + 1.3 : 0,
                            duration: 1.5,
                            times: [0, 0.25, 0.5, 0.75, 1],
                            ease: "linear",
                          },
                        }
                      : {
                          scaleY: {
                            delay: active ? barDelay : 0,
                            duration: 0.7,
                            ease: EASE_BACK,
                          },
                        }
                }
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HowItWorksCard({
  index,
  step,
  cardActive,
  distScale,
  introComplete,
  isMobile,
}: {
  index: number;
  step: (typeof STEPS)[number];
  cardActive: boolean;
  distScale: number;
  introComplete: boolean;
  isMobile: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const cardInView = useInView(cardRef, { once: true, amount: 0.35 });
  const active = isMobile ? cardInView : cardActive;

  const T = isMobile ? CARD_START : CARD_START + index * CARD_STAGGER;
  const V = isMobile ? VISUAL_BASE : VISUAL_BASE + index * VISUAL_STAGGER;

  const [replayToken, setReplayToken] = useState(0);
  const lastHoverReplay = useRef(0);

  const onHover = useCallback(() => {
    if (reduceMotion || isMobile || !introComplete) {
      return;
    }
    if (index !== 1 && index !== 2) {
      return;
    }
    const now = Date.now();
    if (now - lastHoverReplay.current < 900) {
      return;
    }
    lastHoverReplay.current = now;
    setReplayToken((n) => n + 1);
  }, [reduceMotion, isMobile, introComplete, index]);

  const Icon = step.icon;

  return (
    <motion.article
      ref={cardRef}
      className={`lp-home-hiw-card${introComplete && !isMobile ? " is-hover-ready" : ""}`}
      onMouseEnter={onHover}
      initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 36 * distScale }}
      animate={{
        opacity: active || reduceMotion ? 1 : 0,
        y: active || reduceMotion ? 0 : 36 * distScale,
      }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              opacity: { duration: 0.56, ease: "easeOut", delay: active ? T : 0 },
              y: { duration: 0.8, ease: E, delay: active ? T : 0 },
            }
      }
    >
      <div className="lp-home-hiw-card-top">
        <motion.span
          className="lp-home-hiw-step"
          initial={{ opacity: reduceMotion ? 1 : 0 }}
          animate={{ opacity: active || reduceMotion ? 1 : 0 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.3, delay: active ? T + 0.2 : 0 }
          }
        >
          {step.step}
        </motion.span>
        <motion.span
          className="lp-home-hiw-icon-box"
          initial={{
            opacity: reduceMotion ? 1 : 0,
            rotate: reduceMotion ? 0 : -20,
            scale: reduceMotion ? 1 : 0.6,
          }}
          animate={{
            opacity: active || reduceMotion ? 1 : 0,
            rotate: active || reduceMotion ? 0 : -20,
            scale: active || reduceMotion ? 1 : 0.6,
          }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  opacity: { duration: 0.3, delay: active ? T + 0.2 : 0 },
                  rotate: { duration: 0.7, ease: EASE_BACK, delay: active ? T + 0.2 : 0 },
                  scale: { duration: 0.7, ease: EASE_BACK, delay: active ? T + 0.2 : 0 },
                }
          }
        >
          <Icon className="lp-icon" strokeWidth={1.5} aria-hidden />
        </motion.span>
      </div>

      {index === 0 ? (
        <TrackVisual active={active} visualStart={V} distScale={distScale} />
      ) : null}
      {index === 1 ? (
        <TerminalVisual active={active} visualStart={V} replayToken={replayToken} />
      ) : null}
      {index === 2 ? (
        <ScoreVisual active={active} visualStart={V} replayToken={replayToken} />
      ) : null}

      <FadeUp active={active} delay={T + 0.35} y={10} dur={0.6} distScale={distScale}>
        <h3 className="lp-home-hiw-card-title">{step.title}</h3>
      </FadeUp>
      <FadeUp
        active={active}
        delay={T + 0.45}
        y={10}
        dur={0.6}
        distScale={distScale}
        className="lp-home-hiw-card-desc-wrap"
      >
        <p className="lp-home-hiw-card-desc">{step.description}</p>
      </FadeUp>
    </motion.article>
  );
}

export function HomeHowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const sectionInView = useInView(sectionRef, { once: true, amount: 0.25 });
  const reduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const distScale = isMobile ? 0.7 : 1;

  const [introComplete, setIntroComplete] = useState(false);

  useEffect(() => {
    if (!sectionInView || reduceMotion) {
      if (sectionInView && reduceMotion) {
        setIntroComplete(true);
      }
      return;
    }
    const t = window.setTimeout(
      () => setIntroComplete(true),
      INTRO_HOVER_UNLOCK_S * 1000,
    );
    return () => window.clearTimeout(t);
  }, [sectionInView, reduceMotion]);

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
    <section ref={sectionRef} className="lp-home-hiw" aria-labelledby="home-hiw-title">
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
            <HowItWorksCard
              key={step.step}
              index={index}
              step={step}
              cardActive={sectionInView}
              distScale={distScale}
              introComplete={introComplete}
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
