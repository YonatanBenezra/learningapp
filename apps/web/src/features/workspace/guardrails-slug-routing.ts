export type GuardrailsSlugVariant = "g1" | "g2" | "g3";

/** Keep in sync with `exerciseNumber` + `isGuardG*Slug` in apps/api exercises.constants. */
function exerciseNumber(slug: string, prefix: string): number | null {
  if (!slug.startsWith(`${prefix}-`)) {
    return null;
  }
  const match = /^[a-z]+-(\d+)/.exec(slug);
  return match ? Number(match[1]) : null;
}

export function isGuardG1Slug(slug: string): boolean {
  const n = exerciseNumber(slug, "grd");
  return n !== null && (n === 1 || (n >= 4 && n <= 9) || (n >= 16 && n <= 20));
}

export function isGuardG2Slug(slug: string): boolean {
  const n = exerciseNumber(slug, "grd");
  return (
    n !== null && (n === 2 || (n >= 10 && n <= 12) || (n >= 21 && n <= 25))
  );
}

export function isGuardG3Slug(slug: string): boolean {
  const n = exerciseNumber(slug, "grd");
  return (
    n !== null && (n === 3 || (n >= 13 && n <= 15) || (n >= 26 && n <= 30))
  );
}

/** Workspace track from slug — mirrors API grading harness routing. */
export function guardrailsVariantFromSlug(
  slug: string,
): GuardrailsSlugVariant | null {
  if (isGuardG1Slug(slug)) {
    return "g1";
  }
  if (isGuardG2Slug(slug)) {
    return "g2";
  }
  if (isGuardG3Slug(slug)) {
    return "g3";
  }
  return null;
}
