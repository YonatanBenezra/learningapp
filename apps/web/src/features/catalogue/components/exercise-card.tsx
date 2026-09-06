import Link from "next/link";
import { routes } from "@/config/routes";
import { SIMULATOR_LABELS } from "@/config/simulators";
import type { Exercise } from "@/types/exercise";

type ExerciseCardProps = {
  exercise: Exercise;
};

const DIFFICULTY_LABELS: Record<Exercise["difficulty"], string> = {
  E: "Easy",
  M: "Medium",
  H: "Hard",
};

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  return (
    <article className="lp-ex-card">
      <div className="lp-ex-card-meta">
        <span className="lp-ex-badge">{SIMULATOR_LABELS[exercise.simulator]}</span>
        <span className={`lp-ex-badge lp-ex-badge--${exercise.difficulty}`}>
          {DIFFICULTY_LABELS[exercise.difficulty]}
        </span>
      </div>
      <h3 className="lp-ex-card-title">{exercise.title}</h3>
      <p className="lp-ex-card-tags">
        {exercise.skillTags.length > 0
          ? exercise.skillTags.join(" · ")
          : "Graded set · scorecard on submit"}
      </p>
      <Link href={routes.exercise(exercise.slug)} className="lp-cat-btn">
        Start
      </Link>
    </article>
  );
}
