import type { RankedChunk } from './retrieve';

export function promptWantsCitations(prompt: string): boolean {
  return /\[chunk:|citation|\bcite\b/i.test(prompt);
}

export function promptWantsRefusal(prompt: string): boolean {
  return /refuse|i don't know|not in (the )?(retrieved )?context|unanswerable/i.test(
    prompt,
  );
}

export function isRefusal(text: string): boolean {
  return /refuse|i don't know|i do not know|cannot answer|not in (the )?context/i.test(
    text,
  );
}

export function citedChunkIds(text: string): string[] {
  return [...text.matchAll(/\[chunk:([^\]]+)\]/g)].flatMap((match) =>
    match[1] ? [match[1].trim()] : [],
  );
}

export function groundedGenerate(
  prompt: string,
  retrieved: RankedChunk[],
): string {
  const pick = retrieved[0];
  const weak = !pick || pick.score < 4;
  if (promptWantsRefusal(prompt) && weak) {
    return "I don't know. REFUSE";
  }
  if (!pick) {
    return promptWantsRefusal(prompt)
      ? "I don't know. REFUSE"
      : 'No context available.';
  }
  const snippet = pick.chunk.text.slice(0, 320);
  if (promptWantsCitations(prompt)) {
    return `${snippet} [chunk:${pick.chunk.id}]`;
  }
  return snippet;
}
