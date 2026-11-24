import { Tiktoken } from 'js-tiktoken/lite';
import cl100kBase from 'js-tiktoken/ranks/cl100k_base';

export const PINNED_GEN_MODEL = 'labpath-fake-v1';
export const PINNED_JUDGE_MODEL = 'labpath-fake-judge-v1';
export const PINNED_EMBED_MODEL = 'labpath-fake-embed-v1';

/**
 * Budget price, in integer EUR micros per token: €1 / 1M tokens in, €3 / 1M
 * out. Deliberately above the pinned model's list price, so a budget check
 * made before a call never under-counts.
 */
export const INPUT_MICROS_PER_TOKEN = 1;
export const OUTPUT_MICROS_PER_TOKEN = 3;

/** The tokenizer every RAG token gate counts with. */
export const CONTEXT_TOKENIZER = 'cl100k_base';

let encoder: Tiktoken | null = null;

/**
 * Exact token count under a fixed BPE tokenizer (cl100k_base). Gates that cap
 * context size count with this, so a learner's number matches what a real
 * tokenizer reports instead of a characters / 4 guess.
 */
export function countTokens(text: string): number {
  if (!text) {
    return 0;
  }
  encoder ??= new Tiktoken(cl100kBase);
  return encoder.encode(text).length;
}

/**
 * Rough characters / 4 estimate. Kept for the non-RAG simulators whose gates
 * were calibrated on it; RAG grading uses countTokens.
 */
export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function costEurMicros(tokensIn: number, tokensOut: number): number {
  return (
    tokensIn * INPUT_MICROS_PER_TOKEN + tokensOut * OUTPUT_MICROS_PER_TOKEN
  );
}
