import Link from "next/link";
import { SIMULATOR_LABELS } from "@/config/simulators";
import { loginPath, routes } from "@/config/routes";
import type { Exercise } from "@/types/exercise";
import { DIFFICULTY_LABELS } from "./exercise-card";

type Props = {
  exercise: Exercise;
  signedIn: boolean;
};

export function ProblemsGenericRow({ exercise, signedIn }: Props) {
  const href = routes.exercise(exercise.slug);
  const actionHref = signedIn ? href : loginPath(href);

  return (
    <tr className="lp-prob-row">
      <td className="lp-prob-row-problem">
        <div className="lp-prob-row-problem-inner">
          <span className="lp-prob-row-glyph" aria-hidden />
          <div className="lp-prob-row-copy">
            <Link href={href} className="lp-prob-row-title">
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
          <span className="lp-prob-rate-val">—</span>
          <div className="lp-prob-rate-bar is-empty" aria-hidden />
        </div>
      </td>
      <td className="lp-prob-row-action">
        <Link href={actionHref} className="lp-prob-start-btn">
          Start →
        </Link>
      </td>
    </tr>
  );
}
