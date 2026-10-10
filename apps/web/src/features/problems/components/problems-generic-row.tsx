import Link from "next/link";
import { SIMULATOR_LABELS } from "@/config/simulators";
import { loginPath, routes } from "@/config/routes";
import type { Exercise } from "@/types/exercise";
import { DIFFICULTY_LABELS } from "./exercise-card";

type Props = {
  exercise: Exercise;
  signedIn: boolean;
  cleared?: boolean;
  solveRate?: number;
};

export function ProblemsGenericRow({
  exercise,
  signedIn,
  cleared = false,
  solveRate,
}: Props) {
  const href = routes.exercise(exercise.slug);
  const openHref = signedIn ? href : loginPath(href);
  const actionHref = openHref;
  const hasRate = signedIn && typeof solveRate === "number";

  return (
    <tr className="lp-prob-row">
      <td className="lp-prob-row-problem">
        <div className="lp-prob-row-problem-inner">
          <span className="lp-prob-row-glyph" aria-hidden />
          <div className="lp-prob-row-copy">
            <Link href={openHref} className="lp-prob-row-title">
              {exercise.title}
            </Link>
            <p className="lp-prob-row-sub">
              {exercise.skillTags.length > 0
                ? exercise.skillTags.join(" · ")
                : "Graded hidden set · scorecard on submit"}
            </p>
            <div className="lp-prob-row-tags">
              <span>{SIMULATOR_LABELS[exercise.simulator]}</span>
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
        <span className="lp-prob-mode lp-prob-mode--neutral">Practice</span>
      </td>
      <td className="lp-prob-row-rate">
        <div className="lp-prob-rate">
          {hasRate ? (
            <>
              <span className="lp-prob-rate-val">{solveRate}%</span>
              <div className="lp-prob-rate-bar" aria-hidden>
                <span style={{ width: `${solveRate}%` }} />
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
        <Link
          href={actionHref}
          className={cleared ? "lp-prob-start-btn is-cleared" : "lp-prob-start-btn"}
        >
          {cleared ? "Try again" : "Start →"}
        </Link>
      </td>
    </tr>
  );
}
