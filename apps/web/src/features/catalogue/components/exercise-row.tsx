import Link from "next/link";
import { routes } from "@/config/routes";
import { SIMULATOR_LABELS } from "@/config/simulators";
import type { Exercise } from "@/types/exercise";
import { DIFFICULTY_LABELS } from "./exercise-card";

type ExerciseRowProps = {
  exercise: Exercise;
};

export function ExerciseRow({ exercise }: ExerciseRowProps) {
  return (
    <article className="lp-ex-row">
      <div className="lp-ex-row-main">
        <h3 className="lp-ex-row-title">{exercise.title}</h3>
        <p className="lp-ex-row-tags">
          {exercise.skillTags.length > 0
            ? exercise.skillTags.join(" · ")
            : "Graded set · scorecard on submit"}
        </p>
      </div>
      <div className="lp-ex-row-meta">
        <span className="lp-ex-badge">{SIMULATOR_LABELS[exercise.simulator]}</span>
        <span className={`lp-ex-badge lp-ex-badge--${exercise.difficulty}`}>
          {DIFFICULTY_LABELS[exercise.difficulty]}
        </span>
      </div>
      <Link href={routes.exercise(exercise.slug)} className="lp-cat-btn">
        Start
      </Link>
    </article>
  );
}
