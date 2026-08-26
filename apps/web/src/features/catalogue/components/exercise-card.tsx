import Link from "next/link";
import { routes } from "@/config/routes";
import type { Exercise } from "@/types/exercise";

type ExerciseCardProps = {
  exercise: Exercise;
};

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  return (
    <article className="border p-4">
      <p className="text-xs uppercase tracking-wide opacity-70">
        {exercise.simulator} · {exercise.difficulty}
      </p>
      <h2 className="mt-1 font-medium">
        <Link href={routes.exercise(exercise.slug)} className="underline">
          {exercise.title}
        </Link>
      </h2>
      <p className="mt-2 text-sm opacity-70">
        {exercise.skillTags.join(", ")}
      </p>
    </article>
  );
}
