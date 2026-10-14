"use client";

import {
  animate,
  motion,
  useInView,
  useReducedMotion,
  type Transition,
} from "motion/react";
import {
  Activity,
  ArrowRight,
  Check,
  Loader2,
  Play,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { routes } from "@/config/routes";

const E: Transition["ease"] = [0.2, 0, 0, 1];
const EASE_BACK: Transition["ease"] = [0.34, 1.56, 0.64, 1];

const TE = 2.86;
const TYPING_START = 0.9;
const LINE_INTERVAL = 0.16;
const FAST_LINE = 0.06;

const TITLE_SEGMENTS = [
  { words: ["A", "real", "workspace,"], breakAfter: true as const },
  { words: ["not", "a", "slideshow."] },
] as const;

const CHECKLIST = [
  "Python, JSON and YAML configs",
  "Hidden test set, public sample only",
  "Trace for every run: spans, tokens, cost",
] as const;

type TabId = "python" | "json" | "yaml";
type TokenKind = "kw" | "str" | "num" | "cmt" | "plain";

type CodeToken = { text: string; kind?: TokenKind };
type CodeLine = CodeToken[];

const PYTHON_LINES: CodeLine[] = [
  [
    { text: "from", kind: "kw" },
    { text: " labpath " },
    { text: "import", kind: "kw" },
    { text: " Corpus, Retriever" },
  ],
  [],
  [
    { text: "corpus = Corpus.load(" },
    { text: '"help-center"', kind: "str" },
    { text: ")" },
  ],
  [{ text: "chunks = corpus.split(" }],
  [{ text: "    size=" }, { text: "400", kind: "num" }, { text: "," }],
  [{ text: "    overlap=" }, { text: "80", kind: "num" }, { text: "," }],
  [
    { text: '    strategy=' },
    { text: '"heading-aware"', kind: "str" },
    { text: "," },
  ],
  [{ text: ")" }],
  [],
  [
    { text: "retriever = Retriever(chunks, top_k=" },
    { text: "5", kind: "num" },
    { text: ")" },
  ],
  [
    { text: "retriever.submit()   " },
    { text: "# graded on the hidden set", kind: "cmt" },
  ],
];

const JSON_LINES: CodeLine[] = [
  [{ text: "{" }],
  [{ text: '  "corpus": ' }, { text: '"help-center"', kind: "str" }, { text: "," }],
  [{ text: '  "chunks": {' }],
  [{ text: '    "size": ' }, { text: "400", kind: "num" }, { text: "," }],
  [{ text: '    "overlap": ' }, { text: "80", kind: "num" }, { text: "," }],
  [
    { text: '    "strategy": ' },
    { text: '"heading-aware"', kind: "str" },
  ],
  [{ text: "  }," }],
  [{ text: '  "retriever": {' }],
  [{ text: '    "top_k": ' }, { text: "5", kind: "num" }],
  [{ text: "  }" }],
  [{ text: "}" }],
];

const YAML_LINES: CodeLine[] = [
  [{ text: "corpus: " }, { text: "help-center", kind: "str" }],
  [{ text: "chunks:" }],
  [{ text: "  size: " }, { text: "400", kind: "num" }],
  [{ text: "  overlap: " }, { text: "80", kind: "num" }],
  [
    { text: "  strategy: " },
    { text: "heading-aware", kind: "str" },
  ],
  [],
  [{ text: "retriever:" }],
  [{ text: "  top_k: " }, { text: "5", kind: "num" }],
];

const TAB_LINES: Record<TabId, CodeLine[]> = {
  python: PYTHON_LINES,
  json: JSON_LINES,
  yaml: YAML_LINES,
};

const TABS: { id: TabId; label: string }[] = [
  { id: "python", label: "Python" },
  { id: "json", label: "JSON" },
  { id: "yaml", label: "YAML" },
];

function tokenClass(kind?: TokenKind) {
  if (kind === "kw") return "lp-home-live-tok--kw";
  if (kind === "str" || kind === "num") return "lp-home-live-tok--num";
  if (kind === "cmt") return "lp-home-live-tok--cmt";
  return undefined;
}

function FadeUp({
  show,
  delay,
  y = 14,
  dur = 0.7,
  className,
  children,
}: {
  show: boolean;
  delay: number;
  y?: number;
  dur?: number;
  className?: string;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const visible = reduceMotion || show;

  return (
    <motion.div
      className={className}
      initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : y }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : y }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              opacity: { duration: 0.56, ease: "easeOut", delay: show ? delay : 0 },
              y: { duration: dur, ease: E, delay: show ? delay : 0 },
            }
      }
    >
      {children}
    </motion.div>
  );
}

export function HomeLivePracticeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.25 });
  const reduceMotion = useReducedMotion();

  const [tab, setTab] = useState<TabId>("python");
  const [revealedCount, setRevealedCount] = useState(0);
  const [typingDone, setTypingDone] = useState(false);
  const [showCaret, setShowCaret] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runScale, setRunScale] = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [recall, setRecall] = useState(0);
  const [showRecallRow, setShowRecallRow] = useState(false);
  const [showTrace, setShowTrace] = useState(false);
  const [passDotPulse, setPassDotPulse] = useState(false);
  const [resultsDimmed, setResultsDimmed] = useState(false);

  const timersRef = useRef<number[]>([]);
  const recallAnimStop = useRef<(() => void) | null>(null);
  const introRunScheduled = useRef(false);

  const activeLines = TAB_LINES[tab];
  const lineCount = activeLines.length;

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    recallAnimStop.current?.();
    recallAnimStop.current = null;
  }, []);

  const queue = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  }, []);

  const runRecallCount = useCallback(() => {
    recallAnimStop.current?.();
    setRecall(0);
    const controls = animate(0, 0.86, {
      duration: 0.6,
      ease: E,
      onUpdate: (v) => setRecall(v),
    });
    recallAnimStop.current = () => controls.stop();
  }, []);

  const runOutcomeSequence = useCallback(() => {
    setResultsDimmed(true);
    setShowPass(false);
    setShowRecallRow(false);
    setShowTrace(false);
    setPassDotPulse(false);
    setRecall(0);
    setRunScale(1);

    queue(() => setRunScale(0.92), 0);

    queue(() => {
      setRunScale(1);
      setIsRunning(true);
    }, 120);

    queue(() => setIsRunning(false), 520);

    queue(() => {
      setShowPass(true);
      setResultsDimmed(false);
    }, 500);

    queue(() => {
      setShowRecallRow(true);
      runRecallCount();
    }, 700);

    queue(() => setShowTrace(true), 900);

    queue(() => setPassDotPulse(true), 1000);

    queue(() => setPassDotPulse(false), 1800);
  }, [queue, runRecallCount]);

  const scheduleTyping = useCallback(
    (count: number, startSec: number, intervalSec: number, onDone?: () => void) => {
      setRevealedCount(0);
      setTypingDone(false);
      setShowCaret(false);

      for (let n = 1; n <= count; n += 1) {
        const at = (startSec + n * intervalSec) * 1000;
        queue(() => {
          setRevealedCount(n);
          setShowCaret(true);
        }, at);
      }

      const endMs = (startSec + count * intervalSec + 0.05) * 1000;
      queue(() => {
        setTypingDone(true);
        onDone?.();
      }, endMs);
    },
    [queue],
  );

  const scheduleFastTyping = useCallback(
    (count: number) => {
      clearTimers();
      setRevealedCount(0);
      setTypingDone(false);
      setShowPass(false);
      setShowRecallRow(false);
      setShowTrace(false);
      setRecall(0);
      setResultsDimmed(false);
      setIsRunning(false);
      setRunScale(1);

      for (let n = 1; n <= count; n += 1) {
        queue(() => {
          setRevealedCount(n);
          setShowCaret(true);
        }, n * FAST_LINE * 1000);
      }
      queue(() => {
        setTypingDone(true);
        setShowCaret(false);
      }, count * FAST_LINE * 1000 + 40);
    },
    [clearTimers, queue],
  );

  useEffect(() => {
    if (!inView) return;

    if (reduceMotion) {
      setRevealedCount(lineCount);
      setTypingDone(true);
      setShowCaret(false);
      setShowPass(true);
      setShowRecallRow(true);
      setRecall(0.86);
      setShowTrace(true);
      return;
    }

    clearTimers();
    introRunScheduled.current = false;

    scheduleTyping(PYTHON_LINES.length, TYPING_START, LINE_INTERVAL);

    queue(() => setShowCaret(false), TE * 1000);

    queue(() => {
      if (!introRunScheduled.current) {
        introRunScheduled.current = true;
        runOutcomeSequence();
      }
    }, TE * 1000);

    return clearTimers;
  }, [inView, reduceMotion, clearTimers, scheduleTyping, queue, runOutcomeSequence]);

  const onTabChange = (next: TabId) => {
    if (next === tab) return;
    setTab(next);
    if (reduceMotion) {
      setRevealedCount(TAB_LINES[next].length);
      setTypingDone(true);
      setShowCaret(false);
      return;
    }
    scheduleFastTyping(TAB_LINES[next].length);
  };

  const onRunClick = () => {
    if (reduceMotion || isRunning) return;
    clearTimers();
    runOutcomeSequence();
  };

  const titleNodes = useMemo(() => {
    const nodes: ReactNode[] = [];
    let wordIndex = 0;

    TITLE_SEGMENTS.forEach((segment, si) => {
      segment.words.forEach((word, wi) => {
        const delay = 0.15 + wordIndex * 0.1;
        wordIndex += 1;
        nodes.push(
          <motion.span
            key={`${si}-${wi}`}
            className="lp-home-live-title-word"
            initial={{
              opacity: reduceMotion ? 1 : 0,
              y: reduceMotion ? 0 : 20,
              filter: reduceMotion ? "blur(0px)" : "blur(6px)",
            }}
            animate={{
              opacity: inView || reduceMotion ? 1 : 0,
              y: inView || reduceMotion ? 0 : 20,
              filter: inView || reduceMotion ? "blur(0px)" : "blur(6px)",
            }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.6, ease: E, delay: inView ? delay : 0 }
            }
          >
            {word}
            {wi < segment.words.length - 1 ? " " : ""}
          </motion.span>,
        );
      });
      if ("breakAfter" in segment && segment.breakAfter) {
        nodes.push(<br key={`br-${si}`} />);
      }
    });

    return nodes;
  }, [inView, reduceMotion]);

  const recallLabel = `recall@5 ${recall.toFixed(2)} ≥ 0.80`;
  const lastVisibleLine = Math.min(revealedCount, lineCount);

  return (
    <section
      ref={sectionRef}
      className="lp-home-live"
      aria-labelledby="home-live-practice-title"
    >
      <div className="lp-home-live-inner">
        <div className="lp-home-live-row">
          <div className="lp-home-live-copy">
            <FadeUp show={inView} delay={0.1} y={14}>
              <p className="lp-home-live-eyebrow">LIVE PRACTICE</p>
            </FadeUp>

            <h2 id="home-live-practice-title" className="lp-home-live-title">
              {titleNodes}
            </h2>

            <FadeUp show={inView} delay={0.3} y={14}>
              <p className="lp-home-live-body">
                Every exercise opens in a simulator with an editor, a run button and a trace. You
                see what your pipeline did, never what the grader expects.
              </p>
            </FadeUp>

            <ul className="lp-home-live-checklist">
              {CHECKLIST.map((text, i) => (
                <li key={text}>
                  <FadeUp show={inView} delay={0.4 + i * 0.08} y={10} dur={0.65}>
                    <span className="lp-home-live-check-item">
                      <motion.span
                        className="lp-home-live-check-icon"
                        initial={{ scale: reduceMotion ? 1 : 0.6 }}
                        animate={{ scale: inView || reduceMotion ? 1 : 0.6 }}
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : {
                                type: "spring",
                                stiffness: 420,
                                damping: 14,
                                delay: inView ? 0.4 + i * 0.08 : 0,
                              }
                        }
                      >
                        <Check strokeWidth={2.5} aria-hidden />
                      </motion.span>
                      {text}
                    </span>
                  </FadeUp>
                </li>
              ))}
            </ul>

            <FadeUp show={inView} delay={0.7} y={10} className="lp-home-live-cta-wrap">
              <Link href={routes.problems} className="lp-home-live-cta">
                Browse problems
                <ArrowRight strokeWidth={2} aria-hidden />
              </Link>
            </FadeUp>
          </div>

          <motion.div
            className="lp-home-live-preview"
            initial={{
              opacity: reduceMotion ? 1 : 0,
              y: reduceMotion ? 0 : 44,
              scale: reduceMotion ? 1 : 0.96,
            }}
            animate={{
              opacity: inView || reduceMotion ? 1 : 0,
              y: inView || reduceMotion ? 0 : 44,
              scale: inView || reduceMotion ? 1 : 0.96,
            }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.9, ease: E, delay: inView ? 0.3 : 0 }
            }
          >
            <motion.div
              className="lp-home-live-chrome"
              initial={{ opacity: reduceMotion ? 1 : 0 }}
              animate={{ opacity: inView || reduceMotion ? 1 : 0 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.3, ease: "easeOut", delay: inView ? 0.6 : 0 }
              }
            >
              <div className="lp-home-live-dots" aria-hidden>
                <span className="lp-home-live-dot" />
                <span className="lp-home-live-dot" />
                <span className="lp-home-live-dot" />
              </div>
              <div className="lp-home-live-tabs" role="tablist" aria-label="Editor language">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    className={`lp-home-live-tab${tab === t.id ? " is-active" : ""}`}
                    onClick={() => onTabChange(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <span className="lp-home-live-path">rag-001 / retriever.py</span>
            </motion.div>

            <div className="lp-home-live-editor">
              <div className="lp-home-live-gutter" aria-hidden>
                {activeLines.map((_, i) => {
                  const n = i + 1;
                  const visible = reduceMotion || n <= revealedCount;
                  return (
                    <div
                      key={`g-${tab}-${n}`}
                      className="lp-home-live-gutter-line"
                      style={{ visibility: visible ? "visible" : "hidden" }}
                    >
                      {n}
                    </div>
                  );
                })}
              </div>

              <div className="lp-home-live-code-wrap">
                <motion.div
                  key={tab}
                  className="lp-home-live-code-panel"
                  initial={{ opacity: reduceMotion ? 1 : 0.55 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.15 }}
                >
                  {activeLines.map((lineTokens, i) => {
                    const n = i + 1;
                    const visible = reduceMotion || n <= revealedCount;
                    const isLastVisible = visible && n === lastVisibleLine;
                    const showLineCaret = showCaret && isLastVisible && !reduceMotion;

                    return (
                      <span
                        key={`l-${tab}-${n}`}
                        className={`lp-home-live-code-line${visible ? "" : " is-hidden"}`}
                      >
                        {lineTokens.length === 0
                          ? "\u00a0"
                          : lineTokens.map((tok, ti) => (
                              <span key={ti} className={tokenClass(tok.kind)}>
                                {tok.text}
                              </span>
                            ))}
                        {showLineCaret ? <span className="lp-home-live-caret" aria-hidden /> : null}
                      </span>
                    );
                  })}
                </motion.div>
              </div>
            </div>

            <div className="lp-home-live-run-strip">
              <motion.button
                type="button"
                className="lp-home-live-run-btn"
                aria-label="Run code"
                disabled={isRunning}
                animate={{ scale: runScale }}
                transition={
                  runScale < 1
                    ? { duration: 0.12, ease: E }
                    : { type: "spring", stiffness: 500, damping: 15 }
                }
                onClick={onRunClick}
              >
                {isRunning ? (
                  <Loader2 className="lp-home-live-run-spinner" strokeWidth={2.5} aria-hidden />
                ) : (
                  <Play strokeWidth={0} fill="currentColor" aria-hidden />
                )}
                Run
              </motion.button>

              <div className={`lp-home-live-results${resultsDimmed ? " is-dimmed" : ""}`}>
                {showPass ? (
                  <motion.span
                    className="lp-home-live-pass-pill"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      opacity: { duration: 0.2 },
                      scale: { duration: 0.5, ease: EASE_BACK },
                    }}
                  >
                    <motion.span
                      className="lp-home-live-pass-dot"
                      animate={
                        passDotPulse ? { scale: [1, 1.6, 1, 1.6, 1] } : { scale: 1 }
                      }
                      transition={
                        passDotPulse
                          ? { duration: 1.6, times: [0, 0.25, 0.5, 0.75, 1] }
                          : { duration: 0 }
                      }
                      aria-hidden
                    />
                    pass
                  </motion.span>
                ) : null}

                {showRecallRow ? (
                  <motion.span
                    className="lp-home-live-recall"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: E }}
                  >
                    {recallLabel}
                  </motion.span>
                ) : null}
              </div>

              {showTrace ? (
                <motion.span
                  className="lp-home-live-trace"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: E }}
                >
                  <Activity strokeWidth={1.75} aria-hidden />
                  trace · 12 spans · 2.1s
                </motion.span>
              ) : null}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
