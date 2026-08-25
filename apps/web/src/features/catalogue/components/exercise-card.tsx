import type { Exercise } from "@/types/exercise";

type ExerciseCardProps = {
  exercise?: Exercise;
};

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  return (
    <article className="border p-4">
      <h2 className="font-medium">{exercise?.title ?? "Exercise"}</h2>
    </article>
  );
}
