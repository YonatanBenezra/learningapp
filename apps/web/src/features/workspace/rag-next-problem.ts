import { LIVE_RAG_PROBLEMS } from "@/config/live-rag-problems";

export function nextRagProblem(slug: string) {
  const index = LIVE_RAG_PROBLEMS.findIndex((row) => row.slug === slug);
  if (index < 0 || index >= LIVE_RAG_PROBLEMS.length - 1) {
    return null;
  }
  return LIVE_RAG_PROBLEMS[index + 1];
}

export function nextRagProblemCta(slug: string): { href: string; label: string } | null {
  const index = LIVE_RAG_PROBLEMS.findIndex((row) => row.slug === slug);
  if (index < 0 || index >= LIVE_RAG_PROBLEMS.length - 1) {
    return null;
  }
  const current = LIVE_RAG_PROBLEMS[index];
  const next = LIVE_RAG_PROBLEMS[index + 1];
  const step =
    "nextCta" in current && typeof current.nextCta === "string"
      ? current.nextCta
      : next.title;
  return { href: next.href, label: `Next: ${step}` };
}
