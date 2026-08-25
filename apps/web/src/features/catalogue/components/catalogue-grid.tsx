import { ExerciseCard } from "./exercise-card";

export function CatalogueGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ExerciseCard />
    </div>
  );
}
