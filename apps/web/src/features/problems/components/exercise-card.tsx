import Link from "next/link";
import { routes } from "@/config/routes";
import { SIMULATOR_LABELS } from "@/config/simulators";
import type { Exercise } from "@/types/exercise";
import { ExerciseStartBtn } from "./exercise-start-btn";

type ExerciseCardProps = {
  exercise: Exercise;
  index: number;
  signedIn: boolean;
};

export const DIFFICULTY_LABELS: Record<Exercise["difficulty"], string> = {
  E: "Easy",
  M: "Medium",
  H: "Hard",
};

export function ExerciseCard({ exercise, index, signedIn }: ExerciseCardProps) {
  const href = routes.exercise(exercise.slug);

  return (
    <article className="lp-ex-card">
      <span className="lp-ex-card-num" aria-hidden="true">
        {index}
      </span>
      <div className="lp-ex-card-meta">
        <span className="lp-ex-badge">{SIMULATOR_LABELS[exercise.simulator]}</span>
        <span className={`lp-ex-badge lp-ex-badge--${exercise.difficulty}`}>
          {DIFFICULTY_LABELS[exercise.difficulty]}
        </span>
      </div>
      <Link href={href} className="lp-ex-card-link">
        <h3 className="lp-ex-card-title">{exercise.title}</h3>
        <p className="lp-ex-card-tags">
          {exercise.skillTags.length > 0
            ? exercise.skillTags.join(" · ")
            : "Graded set · scorecard on submit"}
        </p>
      </Link>
      <ExerciseStartBtn slug={exercise.slug} signedIn={signedIn} />
    </article>
  );
}
