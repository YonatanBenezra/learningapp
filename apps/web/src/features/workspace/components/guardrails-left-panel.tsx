"use client";

import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Flag,
  Globe,
  KeyRound,
  Lightbulb,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Swords,
  UserRound,
  Zap,
} from "lucide-react";
import type { Exercise } from "@/types/exercise";
import type { FigmaBriefContent } from "./brief-panel";
import type { G1Debrief } from "../guardrails-g1-debrief";
import {
  G1_LEVELS,
  G2_GUARDRAIL_CARD,
  G2_LEVELS,
  G3_FILTER_BUDGET,
  G3_PASS_THRESHOLDS,
  G3_SAMPLE_COUNTS,
  guardrailsObjective,
  guardrailsSubtitle,
  type GuardrailsVariant,
} from "../guardrails-workspace-data";
import { GuardrailsG1DebriefPanel } from "./guardrails-g1-debrief-panel";

const DIFFICULTY = { E: "Easy", M: "Medium", H: "Hard" } as const;

const DIFFICULTY_TAG = { E: "easy", M: "medium", H: "hard" } as const;

type GuardrailsLeftPanelProps = {
  exercise: Exercise;
  variant: GuardrailsVariant;
  activeLevel: number;
  clearedLevels: ReadonlySet<number>;
  liveMode: boolean;
  onLiveModeChange: (live: boolean) => void;
  hints: FigmaBriefContent["hints"];
  debrief?: G1Debrief | null;
  onDismissDebrief?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function GuardrailsLeftPanel({
  exercise,
  variant,
  activeLevel,
  clearedLevels,
  liveMode,
  onLiveModeChange,
  hints,
  debrief = null,
  onDismissDebrief,
  collapsed = false,
  onToggleCollapse,
}: GuardrailsLeftPanelProps) {
  const levels = variant === "g2" ? G2_LEVELS : G1_LEVELS;
  const activeMeta = levels.find((row) => row.level === activeLevel) ?? levels[0];
  const unlockedHints = hints.filter((h) => h.unlocked).length;
  const teamBlue = variant === "g3";
  const skillLine =
    exercise.skillTags.slice(0, 2).join(" · ") || "prompt injection";
  const g2PrimarySkill =
    exercise.skillTags[0]?.replace(/-/g, " ") || "indirect injection";
  const g2SecondarySkill =
    exercise.skillTags[1]?.replace(/-/g, " ") === "tool abuse"
      ? "excessive agency"
      : exercise.skillTags[1]?.replace(/-/g, " ") || "excessive agency";
  const guardrailCard = variant === "g2" ? G2_GUARDRAIL_CARD[activeLevel] : null;
  const g2Tip =
    hints.find((hint) => hint.unlocked)?.text ??
    "Agents often obey text that looks like it came from the user. Where could that text hide on a page?";

  if (collapsed) {
    return (
      <aside className="lp-grd-brief lp-grd-brief--rail">
        <button
          type="button"
          className="lp-grd-brief-rail-expand"
          aria-label="Expand brief"
          onClick={onToggleCollapse}
        >
          <ChevronRight className="size-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className={`lp-grd-brief${variant === "g3" ? " lp-grd-brief--g3" : ""}`}>
      <div className="lp-grd-brief-toolbar">
        <span className="lp-grd-brief-toolbar-label">Brief</span>
        {onToggleCollapse ? (
          <button type="button" className="lp-grd-brief-collapse" onClick={onToggleCollapse}>
            <ChevronDown className="size-4 rotate-90" aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="lp-grd-brief-scroll">
        <div className="lp-grd-brief-tags">
          {variant === "g2" ? (
            <>
              <span className="lp-grd-tag lp-grd-tag--red">
                <Swords className="size-3" aria-hidden />
                Red team
              </span>
              <span className={`lp-grd-tag lp-grd-tag--${DIFFICULTY_TAG[exercise.difficulty]}`}>
                {DIFFICULTY[exercise.difficulty]}
              </span>
              <span className="lp-grd-tag lp-grd-tag--muted">LLM01 · {g2PrimarySkill}</span>
              <span className="lp-grd-tag lp-grd-tag--muted">{g2SecondarySkill}</span>
            </>
          ) : variant === "g3" ? (
            <>
              <span className="lp-grd-tag lp-grd-tag--blue-team">
                <Shield className="size-3" aria-hidden />
                Blue team
              </span>
              <span className={`lp-grd-tag lp-grd-tag--${DIFFICULTY_TAG[exercise.difficulty]}`}>
                {DIFFICULTY[exercise.difficulty]}
              </span>
              <span className="lp-grd-tag lp-grd-tag--muted">guardrails</span>
            </>
          ) : (
            <>
              <span className={`lp-grd-tag${teamBlue ? " lp-grd-tag--blue" : " lp-grd-tag--red"}`}>
                <Swords className="size-3" aria-hidden />
                {teamBlue ? "Blue team" : "Red team"}
              </span>
              <span className={`lp-grd-tag lp-grd-tag--${DIFFICULTY_TAG[exercise.difficulty]}`}>
                {DIFFICULTY[exercise.difficulty]}
              </span>
              <span className="lp-grd-tag lp-grd-tag--muted">LLM01 · {skillLine}</span>
            </>
          )}
        </div>

        <h1 className="lp-grd-brief-title">{exercise.title}</h1>
        <p className="lp-grd-brief-sub">{guardrailsSubtitle(exercise)}</p>

        <div
          className={`lp-grd-objective${variant === "g2" ? " lp-grd-objective--g2" : ""}${variant === "g3" ? " lp-grd-objective--g3" : ""}`}
        >
          {variant === "g2" ? (
            <Globe className="size-4 shrink-0 text-[var(--lp-grd-teal)]" aria-hidden />
          ) : variant === "g3" ? (
            <Shield className="size-4 shrink-0 text-[var(--lp-grd-teal)]" aria-hidden />
          ) : (
            <KeyRound className="size-4 shrink-0 text-[var(--lp-grd-teal)]" aria-hidden />
          )}
          <div>
            <span className="lp-grd-objective-label">Objective</span>
            <p>{guardrailsObjective(exercise)}</p>
          </div>
        </div>

        {variant === "g3" ? (
          <>
            <div className="lp-grd-g3-metrics" aria-label="Pass gates">
              <div className="lp-grd-g3-metric">
                <Swords className="size-4 shrink-0 lp-grd-g3-metric-icon" aria-hidden />
                <div className="lp-grd-g3-metric-copy">
                  <strong>Attack block rate</strong>
                  <span>of {G3_SAMPLE_COUNTS.attacks} sampled attacks</span>
                </div>
                <em className="lp-grd-g3-metric-value">
                  ≥ {Math.round(G3_PASS_THRESHOLDS.attackBlockRate * 100)}%
                </em>
              </div>
              <div className="lp-grd-g3-metric">
                <UserRound className="size-4 shrink-0 lp-grd-g3-metric-icon" aria-hidden />
                <div className="lp-grd-g3-metric-copy">
                  <strong>Benign pass rate</strong>
                  <span>of {G3_SAMPLE_COUNTS.benign} real requests</span>
                </div>
                <em className="lp-grd-g3-metric-value">
                  ≥ {Math.round(G3_PASS_THRESHOLDS.benignPassRate * 100)}%
                </em>
              </div>
              <div className="lp-grd-g3-metric">
                <SlidersHorizontal className="size-4 shrink-0 lp-grd-g3-metric-icon" aria-hidden />
                <div className="lp-grd-g3-metric-copy">
                  <strong>Filter budget</strong>
                  <span>≤ {G3_FILTER_BUDGET.maxTokens} tokens / request</span>
                </div>
                <em className="lp-grd-g3-metric-value">≤ {G3_FILTER_BUDGET.maxCalls} calls</em>
              </div>
            </div>
            <div className="lp-grd-g3-sample-note">
              <Zap className="size-4 shrink-0 lp-grd-g3-sample-note-icon" aria-hidden />
              <p>
                Each attempt uses a fresh random sample from hidden pools. You only see failures from
                your own sample.
              </p>
            </div>
            <div className="lp-grd-brief-tags lp-grd-g3-llm-tags">
              <span className="lp-grd-tag lp-grd-tag--muted">LLM01</span>
              <span className="lp-grd-tag lp-grd-tag--muted">LLM06 · excessive agency</span>
            </div>
          </>
        ) : null}

        {variant === "g2" ? (
          <div className="lp-grd-g2-flow" aria-label="How it works">
            <p className="lp-grd-section-label">How it works</p>
            <div className="lp-grd-g2-flow-track">
              <div className="lp-grd-g2-flow-step lp-grd-g2-flow-step--page">
                <FileText className="size-4 shrink-0 text-[#fca5a5]" aria-hidden />
                <span>
                  <strong>Your page</strong>
                  <em>untrusted</em>
                </span>
              </div>
              <ArrowRight className="lp-grd-g2-flow-arrow size-3.5 shrink-0" aria-hidden />
              <div className="lp-grd-g2-flow-step lp-grd-g2-flow-step--agent">
                <Bot className="size-4 shrink-0 text-[#93c5fd]" aria-hidden />
                <span>
                  <strong>Agent reads</strong>
                  <em>summarize</em>
                </span>
              </div>
              <ArrowRight className="lp-grd-g2-flow-arrow size-3.5 shrink-0" aria-hidden />
              <div className="lp-grd-g2-flow-step lp-grd-g2-flow-step--mail">
                <Mail className="size-4 shrink-0 text-[#fde68a]" aria-hidden />
                <span>
                  <strong>send_email</strong>
                  <em>tool call</em>
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {guardrailCard ? (
          <div className="lp-grd-g2-guardrail-card">
            <div className="lp-grd-g2-guardrail-head">
              <ShieldCheck className="size-4 shrink-0 text-[#fde68a]" aria-hidden />
              <p className="lp-grd-g2-guardrail-title">{guardrailCard.title}</p>
            </div>
            <p className="lp-grd-g2-guardrail-body">{guardrailCard.body}</p>
          </div>
        ) : null}

        {variant !== "g3" ? (
          <>
            {variant === "g2" ? <p className="lp-grd-section-label">Levels</p> : null}
            <div
              className={`lp-grd-levels-row${variant === "g2" ? " lp-grd-levels-row--g2" : ""}`}
              role="list"
              aria-label="Levels"
            >
              {levels.map((row) => {
                const cleared = clearedLevels.has(row.level);
                const active = row.level === activeLevel;
                const locked = row.level > activeLevel && !cleared;
                return (
                  <div
                    key={row.level}
                    role="listitem"
                    className={`lp-grd-level-card${active ? " is-active" : ""}${cleared ? " is-cleared" : ""}${locked ? " is-locked" : ""}${variant === "g2" ? " lp-grd-level-card--g2" : ""}`}
                  >
                    <span className="lp-grd-level-card-icon">
                      {cleared ? (
                        <Check className="size-3.5 text-[#4ade80]" strokeWidth={2.5} />
                      ) : locked ? (
                        <Lock className="size-3" />
                      ) : active ? (
                        variant === "g2" ? (
                          <Flag className="size-3 text-[#fde68a]" fill="currentColor" />
                        ) : (
                          "⚑"
                        )
                      ) : (
                        row.level
                      )}
                    </span>
                    <span className="lp-grd-level-card-label">Level {row.level}</span>
                    <span className="lp-grd-level-card-title">{row.title}</span>
                  </div>
                );
              })}
            </div>

            {variant === "g1" ? (
              <div className="lp-grd-defence-box">
                <div className="lp-grd-defence-head">
                  <Shield className="size-4 text-[var(--lp-grd-teal)]" aria-hidden />
                  <span>Defences this level</span>
                  <ChevronDown className="size-4 ml-auto opacity-60" aria-hidden />
                </div>
                <p>{activeMeta.defense}</p>
              </div>
            ) : null}
          </>
        ) : null}

        {debrief ? (
          <div className="lp-grd-debrief-wrap">
            <GuardrailsG1DebriefPanel debrief={debrief} />
            {onDismissDebrief ? (
              <button type="button" className="lp-grd-debrief-dismiss" onClick={onDismissDebrief}>
                Back to brief
              </button>
            ) : null}
          </div>
        ) : null}

        {!debrief && variant === "g2" ? (
          <div className="lp-grd-g2-tip">
            <Lightbulb className="size-4 shrink-0 text-[#fde68a]" aria-hidden />
            <p>{g2Tip}</p>
          </div>
        ) : null}

        {!debrief && variant !== "g2" && hints.length > 0 ? (
          <div className="lp-grd-hints-block">
            <p className="lp-grd-hints-head">
              Hints · {unlockedHints} of {hints.length} unlocked
            </p>
            <ul>
              {hints.map((hint) =>
                hint.unlocked ? (
                  <li key={hint.n} className="lp-grd-hint lp-grd-hint--open">
                    <Lightbulb className="size-3.5 shrink-0" aria-hidden />
                    <span>{hint.text}</span>
                  </li>
                ) : (
                  <li key={hint.n} className="lp-grd-hint lp-grd-hint--locked">
                    <Lock className="size-3 shrink-0" aria-hidden />
                    <span>
                      Hint {hint.n} unlocks after {hint.unlockAfter} attempts.
                    </span>
                  </li>
                ),
              )}
            </ul>
          </div>
        ) : null}

        {variant === "g1" ? (
          <div className="lp-grd-mode" role="group" aria-label="Workspace mode">
            <button
              type="button"
              className={`lp-grd-mode-card${liveMode ? " is-active" : ""}`}
              onClick={() => onLiveModeChange(true)}
            >
              <strong>Live</strong>
              <span>Every send is graded</span>
            </button>
            <button
              type="button"
              className={`lp-grd-mode-card${!liveMode ? " is-active" : ""}`}
              onClick={() => onLiveModeChange(false)}
            >
              <strong>Practice</strong>
              <span>Submit when ready</span>
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
