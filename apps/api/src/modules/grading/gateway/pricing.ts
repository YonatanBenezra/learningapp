export const PINNED_GEN_MODEL = 'labpath-fake-v1';
export const PINNED_JUDGE_MODEL = 'labpath-fake-judge-v1';
export const PINNED_EMBED_MODEL = 'labpath-fake-embed-v1';

/** Integer EUR micros per token. €1 / 1M tokens in, €3 / 1M out. */
export const INPUT_MICROS_PER_TOKEN = 1;
export const OUTPUT_MICROS_PER_TOKEN = 3;

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function costEurMicros(tokensIn: number, tokensOut: number): number {
  return (
    tokensIn * INPUT_MICROS_PER_TOKEN + tokensOut * OUTPUT_MICROS_PER_TOKEN
  );
}
