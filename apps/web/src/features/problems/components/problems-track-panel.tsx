import { BookOpen, Check, Flag, Lock, Radio } from "lucide-react";
import { GUARDRAILS_TRACK_CLEARED, GUARDRAILS_TRACK_LEVELS, GUARDRAILS_TRACK_TOTAL } from "../problems-figma-meta";

function LevelIcon({ state }: { state: (typeof GUARDRAILS_TRACK_LEVELS)[number]["state"] }) {
  if (state === "cleared") {
    return (
      <span className="lp-prob-track-icon lp-prob-track-icon--cleared" aria-hidden>
        <Check className="size-3" strokeWidth={2.5} />
      </span>
    );
  }
  if (state === "in_progress") {
    return (
      <span className="lp-prob-track-icon lp-prob-track-icon--progress" aria-hidden>
        <Flag className="size-3" strokeWidth={2.2} />
      </span>
    );
  }
  if (state === "locked") {
    return (
      <span className="lp-prob-track-icon lp-prob-track-icon--locked" aria-hidden>
        <Lock className="size-3" strokeWidth={2} />
      </span>
    );
  }
  return (
    <span className="lp-prob-track-icon lp-prob-track-icon--todo" aria-hidden>
      <Radio className="size-3" strokeWidth={2} />
    </span>
  );
}

function levelStatusLabel(state: (typeof GUARDRAILS_TRACK_LEVELS)[number]["state"]) {
  switch (state) {
    case "cleared":
      return "cleared";
    case "in_progress":
      return "in progress";
    case "locked":
      return "locked";
    default:
      return "not started";
  }
}

export function ProblemsTrackPanel() {
  return (
    <aside className="lp-prob-track" aria-label="Guardrails track progress">
      <p className="lp-prob-track-kicker">Guardrails track</p>
      <div className="lp-prob-track-headline">
        <p className="lp-prob-track-ratio">
          {GUARDRAILS_TRACK_CLEARED} / {GUARDRAILS_TRACK_TOTAL}
        </p>
        <p className="lp-prob-track-sub">levels cleared</p>
      </div>

      <div className="lp-prob-track-dots" aria-hidden>
        {Array.from({ length: GUARDRAILS_TRACK_TOTAL }, (_, i) => (
          <span key={i} className={i < GUARDRAILS_TRACK_CLEARED ? "is-on" : undefined} />
        ))}
      </div>

      <ul className="lp-prob-track-levels">
        {GUARDRAILS_TRACK_LEVELS.map((level) => (
          <li key={level.id}>
            <LevelIcon state={level.state} />
            <span className="lp-prob-track-level-label">{level.label}</span>
            <span className={`lp-prob-track-level-state is-${level.state}`}>
              {levelStatusLabel(level.state)}
            </span>
          </li>
        ))}
      </ul>

      <div className="lp-prob-track-ref">
        <BookOpen className="size-3.5 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
        <span>OWASP LLM01 · prompt injection</span>
      </div>
    </aside>
  );
}
