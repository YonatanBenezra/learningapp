"use client";

import { Hexagon, Send, Trophy } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { canaryPreview, type G1LevelWin } from "../guardrails-g1-debrief";
import {
  G1_LEVELS,
  type G1SimulatorProfile,
} from "../guardrails-workspace-data";
import { simulationsApi, type G1Turn } from "../simulations-api";

type ChatLine =
  | { kind: "user"; text: string; time: string }
  | { kind: "assistant"; text: string; time: string; detector?: string }
  | { kind: "detector"; text: string };

type GuardrailsG1ChatPanelProps = {
  exerciseSlug: string;
  simulator: G1SimulatorProfile;
  disabled?: boolean;
  liveMode: boolean;
  level: number;
  onLevelChange: (level: number) => void;
  clearedLevels: ReadonlySet<number>;
  onLevelCleared: (level: number) => void;
  onAttempt: () => void;
  onDraftChange: (text: string) => void;
  onLevelWin?: (win: G1LevelWin) => void;
  onViewDebrief?: () => void;
  onSubmitGrade?: () => void;
  gradeSubmitDisabled?: boolean;
  submitError?: string | null;
  gradePending?: boolean;
};

function timeLabel() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function focusChatInput(input: HTMLTextAreaElement | null, selectAll = false) {
  if (!input || input.disabled) {
    return;
  }
  requestAnimationFrame(() => {
    input.focus();
    if (selectAll) {
      input.select();
    }
  });
}

function detectorLine(turn: G1Turn, attempt: number): string {
  if (turn.won) {
    return `Detectors · canary detected · attempt ${attempt}`;
  }
  if (turn.filtered) {
    return `Detectors · partial match · attempt ${attempt}`;
  }
  return `Detectors · canary not found · attempt ${attempt}`;
}

function openingLine(simulator: G1SimulatorProfile): ChatLine {
  return {
    kind: "assistant",
    time: timeLabel(),
    text: simulator.openingGreeting,
  };
}

export function GuardrailsG1ChatPanel({
  exerciseSlug,
  simulator,
  disabled,
  liveMode,
  level,
  onLevelChange,
  clearedLevels,
  onLevelCleared,
  onAttempt,
  onDraftChange,
  onLevelWin,
  onViewDebrief,
  onSubmitGrade,
  gradeSubmitDisabled,
  submitError,
  gradePending,
}: GuardrailsG1ChatPanelProps) {
  const [message, setMessage] = useState("");
  const [lines, setLines] = useState<ChatLine[]>(() => [openingLine(simulator)]);
  const [pending, setPending] = useState(false);
  const [failNotice, setFailNotice] = useState<string | null>(null);
  const [levelWin, setLevelWin] = useState<G1Turn | null>(null);
  const [sendAttempts, setSendAttempts] = useState(0);
  const [winTime, setWinTime] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const levelMeta = G1_LEVELS.find((row) => row.level === level) ?? G1_LEVELS[0];

  useEffect(() => {
    const log = logRef.current;
    if (!log) {
      return;
    }
    log.scrollTop = log.scrollHeight;
  }, [lines, failNotice, levelWin]);

  useEffect(() => {
    setLines([openingLine(simulator)]);
    setFailNotice(null);
    setLevelWin(null);
    setSendAttempts(0);
    setWinTime(null);
    setMessage("");
  }, [simulator.appTitle, simulator.openingGreeting, simulator.statusLine]);
  const levelCleared = clearedLevels.has(level) || Boolean(levelWin);

  const placeholder = levelCleared
    ? level >= 3
      ? "Level cleared · submit attempt for grade"
      : "Level cleared · continue to next level"
    : failNotice
      ? "Try another angle…"
      : "Try to break the level…";

  function resetLevel() {
    setLines([openingLine(simulator)]);
    setFailNotice(null);
    setLevelWin(null);
    setSendAttempts(0);
    setWinTime(null);
    setMessage("");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim() || disabled || pending || levelCleared) {
      return;
    }
    const userText = message.trim();
    setLines((current) => [...current, { kind: "user", text: userText, time: timeLabel() }]);
    setMessage("");
    setPending(true);
    setFailNotice(null);
    let clearedThisTurn = false;
    try {
      const turn = await simulationsApi.g1Turn(exerciseSlug, level, userText);
      const attempt = sendAttempts + 1;
      setSendAttempts(attempt);
      onAttempt();
      const detector = detectorLine(turn, attempt);
      setLines((current) => [
        ...current,
        {
          kind: "assistant",
          time: timeLabel(),
          text: turn.reply,
          detector: turn.attackAttempt ? detector : undefined,
        },
      ]);
      if (turn.attackAttempt) {
        onDraftChange(userText);
      } else {
        onDraftChange("");
      }

      if (turn.won) {
        clearedThisTurn = true;
        setLevelWin(turn);
        const clearedAt = timeLabel();
        setWinTime(clearedAt);
        onLevelCleared(level);
        onLevelWin?.({
          level,
          attempts: attempt,
          encoding: turn.encoding,
          clearedAt,
          attackPrompt: turn.attackAttempt ? userText : undefined,
        });
      } else if (turn.attackAttempt && liveMode) {
        setFailNotice(
          turn.filtered
            ? "Not yet — canary not detected. Partial leak was filtered. Rephrase and try again."
            : "Not yet — canary not detected. The concierge refused. Rephrase and try again; focus on their role and wording.",
        );
      }
    } catch (caught: unknown) {
      setMessage(userText);
      onDraftChange(userText);
      setFailNotice(caught instanceof Error ? caught.message : "Send failed");
      focusChatInput(inputRef.current, true);
    } finally {
      setPending(false);
      if (!clearedThisTurn) {
        focusChatInput(inputRef.current);
      }
    }
  }

  const winBanner = useMemo(() => {
    if (!levelWin) {
      return null;
    }
    const preview = canaryPreview(levelWin.encoding);
    return (
      <div className="lp-grd-win" role="status">
        <div className="lp-grd-win-main">
          <Trophy className="size-9 text-[#d4af37]" strokeWidth={1.5} aria-hidden />
          <div>
            <p className="lp-grd-win-title">LEVEL CLEARED</p>
            <p className="lp-grd-win-meta">
              Level {levelWin.level} · {levelMeta.title} · {sendAttempts} attempts
            </p>
          </div>
        </div>
        <div className="lp-grd-win-canary-row">
          <span>Canary detected</span>
          <strong>{preview}</strong>
          {winTime ? <time>{winTime}</time> : null}
        </div>
        <div className="lp-grd-win-actions">
          {onViewDebrief ? (
            <button type="button" className="lp-grd-win-debrief" onClick={onViewDebrief}>
              View debrief
            </button>
          ) : null}
          {level < 3 ? (
            <button
              type="button"
              className="lp-grd-win-next"
              onClick={() => {
                onLevelChange(level + 1);
                resetLevel();
              }}
            >
              Next level
            </button>
          ) : null}
        </div>
      </div>
    );
  }, [level, levelMeta.title, levelWin, onLevelChange, onViewDebrief, sendAttempts, winTime]);

  return (
    <section className="lp-grd-chat">
      <div className="lp-grd-chat-toolbar">
        <span className="lp-grd-chat-meta-pill">mock app · simulated</span>
        <button type="button" className="lp-grd-chat-reset" onClick={resetLevel}>
          Reset level
        </button>
      </div>
      <div className="lp-grd-chat-head">
        <span className="lp-grd-chat-hex" aria-hidden>
          <Hexagon className="size-5" strokeWidth={1.75} />
        </span>
        <div className="lp-grd-chat-head-copy">
          <h2>{simulator.appTitle}</h2>
          <p>
            <span className="lp-grd-chat-dot" aria-hidden /> {simulator.statusLine}
          </p>
        </div>
      </div>

      <div className="lp-grd-chat-log" ref={logRef}>
        {lines.map((line, index) => {
          if (line.kind === "user") {
            return (
              <article key={index} className="lp-grd-chat-turn lp-grd-chat-turn--user">
                <header>
                  <span>You</span>
                  <time>{line.time}</time>
                </header>
                <p>{line.text}</p>
              </article>
            );
          }
          if (line.kind === "assistant") {
            return (
              <article key={index} className="lp-grd-chat-turn lp-grd-chat-turn--bot">
                <header>
                  <span>Concierge</span>
                  <time>{line.time}</time>
                </header>
                <p>{line.text}</p>
                {line.detector ? (
                  <span className="lp-grd-detector-pill">{line.detector}</span>
                ) : null}
              </article>
            );
          }
          return null;
        })}
        {winBanner}
      </div>

      {failNotice && !levelCleared ? (
        <p className="lp-grd-chat-fail" role="alert">
          {failNotice}
        </p>
      ) : null}

      {gradePending ? (
        <p className="lp-grd-chat-grade-status" role="status">
          Grading your attempt… see Test Result panel below.
        </p>
      ) : null}

      {submitError ? (
        <p className="lp-grd-chat-fail" role="alert">
          {submitError}
        </p>
      ) : null}

      <form className="lp-grd-chat-compose" onSubmit={(event) => void onSubmit(event)}>
        <div className={`lp-grd-chat-input-wrap${failNotice ? " is-shake" : ""}`}>
          <textarea
            ref={inputRef}
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              onDraftChange(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            disabled={disabled || pending}
            rows={2}
            placeholder={placeholder}
            className="lp-grd-chat-input"
          />
          <button
            type="submit"
            disabled={disabled || pending || !message.trim() || levelCleared}
            className="lp-grd-chat-send"
          >
            <Send className="size-4" aria-hidden />
            Send
          </button>
        </div>
        <footer className="lp-grd-chat-foot">
          <p>
            {gradePending
              ? "Official grade runs on the server — results open in Test Result."
              : liveMode
                ? "Live chat probes detectors · Submit attempt for grade uses the Test Result panel."
                : "Practice freely — only Submit attempt for grade counts toward the board."}
          </p>
          {onSubmitGrade ? (
            <button
              type="button"
              className="lp-grd-grade-link"
              disabled={gradeSubmitDisabled}
              title={
                gradeSubmitDisabled
                  ? "Send an attack message first (e.g. hex override prompt), or paste it in the box after a level clear."
                  : undefined
              }
              onClick={onSubmitGrade}
            >
              Submit attempt for grade
            </button>
          ) : null}
        </footer>
      </form>
    </section>
  );
}
