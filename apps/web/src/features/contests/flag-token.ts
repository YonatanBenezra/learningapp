import type { Grade } from "@/types/grade";

/** Display flag for a captured contest problem (API may add scorecard.flag later). */
export function flagTokenForExercise(
  exerciseSlug: string,
  grade?: Grade | null,
): string {
  const sc = grade?.scorecard;
  if (sc && typeof sc.flag === "string") {
    return sc.flag;
  }
  if (sc && typeof sc.flagToken === "string") {
    return sc.flagToken;
  }
  const inner = exerciseSlug.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
  return `LABPATH{${inner || "capture"}_ok}`;
}
