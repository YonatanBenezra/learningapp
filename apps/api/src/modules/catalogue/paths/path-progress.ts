export type PathProgress = {
  stepCount: number;
  passedCount: number;
  nextSlug: string | null;
  complete: boolean;
};

export function pathProgress(
  steps: string[],
  passed: ReadonlySet<string>,
): PathProgress {
  const passedCount = steps.filter((slug) => passed.has(slug)).length;
  const nextSlug = steps.find((slug) => !passed.has(slug)) ?? null;
  return {
    stepCount: steps.length,
    passedCount,
    nextSlug,
    complete: steps.length > 0 && nextSlug === null,
  };
}
