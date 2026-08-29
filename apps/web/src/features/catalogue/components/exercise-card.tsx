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
    <article className="lp-card">
      <div className="lp-card-meta">
        <span className="lp-badge">{SIMULATOR_LABELS[exercise.simulator]}</span>
        <span className="lp-badge lp-badge--muted">
          {DIFFICULTY_LABELS[exercise.difficulty]}
        </span>
      </div>
      <h2 className="lp-card-title">
        <Link href={routes.exercise(exercise.slug)} className="lp-card-link">
          {exercise.title}
        </Link>
      </h2>
      {exercise.skillTags.length > 0 ? (
        <p className="lp-card-tags">{exercise.skillTags.join(" · ")}</p>
      ) : null}
    </article>
  );
}
