import Link from "next/link";
import { routes } from "@/config/routes";
import { SIMULATOR_LABELS } from "@/config/simulators";
import type { Exercise } from "@/types/exercise";
import { DIFFICULTY_LABELS } from "./exercise-card";
import { ExerciseStartBtn } from "./exercise-start-btn";

type ExerciseRowProps = {
  exercise: Exercise;
  index: number;
  signedIn: boolean;
};

export function ExerciseRow({ exercise, index, signedIn }: ExerciseRowProps) {
  const href = routes.exercise(exercise.slug);

  return (
    <article className="lp-ex-row">
      <span className="lp-ex-row-num" aria-hidden="true">
        {index}
      </span>
      <Link href={href} className="lp-ex-row-link">
        <h3 className="lp-ex-row-title">{exercise.title}</h3>
        <p className="lp-ex-row-tags">
          {exercise.skillTags.length > 0
            ? exercise.skillTags.join(" · ")
            : "Graded set · scorecard on submit"}
        </p>
      </Link>
      <div className="lp-ex-row-meta">
        <span className="lp-ex-badge">{SIMULATOR_LABELS[exercise.simulator]}</span>
        <span className={`lp-ex-badge lp-ex-badge--${exercise.difficulty}`}>
          {DIFFICULTY_LABELS[exercise.difficulty]}
        </span>
      </div>
      <ExerciseStartBtn slug={exercise.slug} signedIn={signedIn} />
    </article>
  );
}
