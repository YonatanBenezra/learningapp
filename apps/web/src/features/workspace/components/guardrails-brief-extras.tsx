"use client";

import { Check, Lock } from "lucide-react";
import type { FigmaBriefContent } from "./brief-panel";
import {
  G1_LEVELS,
  G2_LEVELS,
  guardrailsObjective,
  guardrailsSubtitle,
  type GuardrailsVariant,
} from "../guardrails-workspace-data";
import type { Exercise } from "@/types/exercise";

type GuardrailsBriefExtrasProps = {
  exercise: Exercise;
  variant: GuardrailsVariant;
  activeLevel: number;
  clearedLevels: ReadonlySet<number>;
  liveMode: boolean;
  onLiveModeChange: (live: boolean) => void;
  hints: FigmaBriefContent["hints"];
};

export function GuardrailsBriefExtras({
  exercise,
  variant,
  activeLevel,
  clearedLevels,
  liveMode,
  onLiveModeChange,
  hints,
}: GuardrailsBriefExtrasProps) {
  const levels = variant === "g2" ? G2_LEVELS : G1_LEVELS;
  const activeMeta = levels.find((row) => row.level === activeLevel) ?? levels[0];

  return (
    <div className="lp-grd-brief-extras">
      <p className="lp-grd-brief-sub">{guardrailsSubtitle(exercise)}</p>

      <div className="lp-grd-objective">
        <span className="lp-grd-objective-label">Objective</span>
        <p className="lp-grd-objective-text">{guardrailsObjective(exercise)}</p>
      </div>

      {variant !== "g3" ? (
        <>
          <div className="lp-grd-levels" role="list" aria-label="Levels">
            {levels.map((row) => {
              const cleared = clearedLevels.has(row.level);
              const active = row.level === activeLevel;
              const locked = row.level > activeLevel && !cleared;
              return (
                <div
                  key={row.level}
                  role="listitem"
                  className={`lp-grd-level${active ? " is-active" : ""}${cleared ? " is-cleared" : ""}${locked ? " is-locked" : ""}`}
                >
                  <span className="lp-grd-level-num">
                    {cleared ? (
                      <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                    ) : locked ? (
                      <Lock className="size-3" strokeWidth={2.25} aria-hidden />
                    ) : (
                      row.level
                    )}
                  </span>
                  <span className="lp-grd-level-copy">
                    <strong>Level {row.level}</strong>
                    <span>{row.title}</span>
                  </span>
                </div>
              );
            })}
          </div>

          <details className="lp-grd-defence" open>
            <summary>Defences this level</summary>
            <p>{activeMeta.defense}</p>
          </details>
        </>
      ) : null}

      {hints.length > 0 ? (
        <div className="lp-grd-hints">
          <p className="lp-grd-hints-title">Hints</p>
          <ul>
            {hints.map((hint) =>
              hint.unlocked ? (
                <li key={hint.n} className="lp-grd-hint is-unlocked">
                  {hint.text}
                </li>
              ) : (
                <li key={hint.n} className="lp-grd-hint is-locked">
                  Hint {hint.n} unlocks after {hint.unlockAfter} attempts.
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
            className={`lp-grd-mode-btn${liveMode ? " is-active" : ""}`}
            onClick={() => onLiveModeChange(true)}
          >
            <strong>Live</strong>
            <span>Every Send is graded</span>
          </button>
          <button
            type="button"
            className={`lp-grd-mode-btn${!liveMode ? " is-active" : ""}`}
            onClick={() => onLiveModeChange(false)}
          >
            <strong>Practice</strong>
            <span>Submit when ready</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
