/** First readable paragraph from exercise brief markdown for drawer preview. */
export function exerciseBriefSnippet(briefMd: string, maxLen = 480): string {
  const stripped = briefMd
    .replace(/^#+\s+.+/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\n+/g, " ")
    .trim();
  if (!stripped) {
    return "Open the lab for the full brief and hidden grader criteria.";
  }
  if (stripped.length <= maxLen) {
    return stripped;
  }
  return `${stripped.slice(0, maxLen).trimEnd()}…`;
}
