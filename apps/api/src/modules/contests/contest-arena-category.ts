/** Arena sidebar category ids — keep in sync with web `ArenaCategoryId`. */
export type ContestArenaCategory =
  | 'prompt-injection'
  | 'retrieval'
  | 'guardrails'
  | 'evals'
  | 'exfiltration';

export function arenaCategoryForExercise(
  slug: string,
  simulator: string,
): ContestArenaCategory {
  if (simulator === 'rag') {
    return 'retrieval';
  }
  if (simulator === 'guardrails') {
    const hay = slug.toLowerCase();
    if (/inject|payload|indirect|page-inject/.test(hay)) {
      return 'prompt-injection';
    }
    if (/extract|hex|smuggle|bcc|encoding|exfil/.test(hay)) {
      return 'exfiltration';
    }
    return 'guardrails';
  }
  return 'evals';
}
