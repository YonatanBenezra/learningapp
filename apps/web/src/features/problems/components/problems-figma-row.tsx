import Link from "next/link";
import { Activity, Shield, Swords } from "lucide-react";
import { loginPath, routes } from "@/config/routes";
import type { Exercise } from "@/types/exercise";
import type { ProblemFigmaMeta } from "../problems-figma-meta";
import { DIFFICULTY_LABELS } from "./exercise-card";

type Props = {
  exercise: Exercise;
  meta: ProblemFigmaMeta;
  signedIn: boolean;
};

function StatusGlyph({ status }: { status: ProblemFigmaMeta["status"] }) {
  if (status === "in_progress") {
    return (
      <span className="lp-prob-row-glyph lp-prob-row-glyph--active" aria-hidden>
        <Activity className="size-3.5" strokeWidth={2.25} />
      </span>
    );
  }
  return <span className="lp-prob-row-glyph lp-prob-row-glyph--empty" aria-hidden />;
}

function ModeBadge({ meta }: { meta: ProblemFigmaMeta }) {
  return (
    <span className={`lp-prob-mode lp-prob-mode--${meta.mode}`}>
      {meta.mode === "red" ? (
        <Swords className="lp-prob-mode-icon" aria-hidden size={12} strokeWidth={2} />
      ) : (
        <Shield className="lp-prob-mode-icon" aria-hidden size={12} strokeWidth={2} />
      )}
      {meta.modeLabel}
    </span>
  );
}

export function ProblemsFigmaRow({ exercise, meta, signedIn }: Props) {
  const href = routes.exercise(exercise.slug);
  const baseTitle = exercise.title.trim();
  const title = baseTitle.toUpperCase().startsWith(meta.code.toUpperCase())
    ? baseTitle
    : `${meta.code} ${baseTitle}`;

  const actionHref = signedIn ? href : loginPath(href);
  const showContinue = meta.status === "in_progress" && meta.continueLevel;

  return (
    <tr className="lp-prob-row">
      <td className="lp-prob-row-problem">
        <div className="lp-prob-row-problem-inner">
          <StatusGlyph status={meta.status} />
          <div className="lp-prob-row-copy">
            <Link href={href} className="lp-prob-row-title">
              {title}
            </Link>
            <p className="lp-prob-row-sub">{meta.subtitle}</p>
            <div className="lp-prob-row-tags">
              {meta.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </td>
      <td className="lp-prob-row-diff">
        <span className={`lp-prob-diff lp-prob-diff--${exercise.difficulty}`}>
          {DIFFICULTY_LABELS[exercise.difficulty]}
        </span>
      </td>
      <td className="lp-prob-row-mode">
        <ModeBadge meta={meta} />
      </td>
      <td className="lp-prob-row-rate">
        <div className="lp-prob-rate">
          {typeof meta.solveRate === "number" ? (
            <>
              <span className="lp-prob-rate-val">{meta.solveRate}%</span>
              <div className="lp-prob-rate-bar" aria-hidden>
                <span style={{ width: `${meta.solveRate}%` }} />
              </div>
            </>
          ) : (
            <>
              <span className="lp-prob-rate-val">—</span>
              <div className="lp-prob-rate-bar is-empty" aria-hidden />
            </>
          )}
        </div>
      </td>
      <td className="lp-prob-row-action">
        {showContinue ? (
          <div className="lp-prob-action-stack">
            <Link href={actionHref} className="lp-prob-continue">
              Continue →
            </Link>
            <span className="lp-prob-continue-hint">
              Level {meta.continueLevel!.current} of {meta.continueLevel!.total}
            </span>
          </div>
        ) : (
          <Link href={actionHref} className="lp-prob-start-btn">
            Start →
          </Link>
        )}
      </td>
    </tr>
  );
}
