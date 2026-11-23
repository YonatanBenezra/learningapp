import { BOOKING_CANARY, G1_LEVELS } from './levels';
import { runConciergeTurn } from './concierge';
import { maskSecret } from './g3-bot';
import type { GuardrailsGradeResult } from './guardrails.types';
import { isGuardCanary } from './guardrails.types';

/**
 * The concierge is a deterministic simulator, not a model: no model is called
 * and nothing is billed to the run.
 */
export function gradeG1(
  attackPrompt: string,
  hidden: unknown,
  publicItems: unknown[] = [],
  exerciseSlug?: string,
): GuardrailsGradeResult {
  const canary = readCanary(hidden);
  const wins: { level: number; won: boolean; encoding: string | null }[] = [];
  const levels: {
    level: number;
    won: boolean;
    filtered: boolean;
    reply: string;
  }[] = [];
  for (const manifest of G1_LEVELS) {
    const turn = runConciergeTurn(manifest.level, attackPrompt, canary, {
      exerciseSlug,
    });
    wins.push({
      level: manifest.level,
      won: turn.won,
      encoding: turn.encoding,
    });
    // The trace never carries the code itself, in any form.
    levels.push({
      level: manifest.level,
      won: turn.won,
      filtered: turn.filtered,
      reply: turn.won
        ? `The reply carried the code (${turn.encoding ?? 'detected'}).`
        : maskSecret(turn.reply, canary),
    });
  }
  const passed = wins.every((row) => row.won);
  const publicSafe = publicItems.filter((item) => !isGuardCanary(item));
  return {
    verdict: passed ? 'pass' : 'fail',
    metrics: {
      levels_won: { value: wins.filter((row) => row.won).length, total: 3 },
    },
    gateResults: [
      {
        id: 'all-levels',
        class: 'A',
        metric: 'levels_won',
        op: 'eq',
        value: 3,
        actual: wins.filter((row) => row.won).length,
        passed,
      },
    ],
    failureClasses: passed ? [] : ['prompt-injection'],
    scorecard: {
      wins,
      debrief: passed
        ? wins.map(
            (row) => `L${row.level} carried via ${row.encoding ?? 'unknown'}`,
          )
        : wins.filter((row) => !row.won).map((row) => `L${row.level} held`),
    },
    failingCases: wins
      .filter((row) => !row.won)
      .map((row) => ({
        question: `level ${row.level}`,
        note: 'no-canary',
      })),
    trace: {
      simulator: 'guardrails',
      payload: { attackPrompt },
      levels,
      k: 0,
      chunkCount: 0,
      tokensIn: 0,
      tokensOut: 0,
      costEurMicros: 0,
      queries: publicSafe.slice(0, 5).map((item, index) => ({
        source: 'public' as const,
        question: publicQuestion(item, index),
        retrieved: [],
      })),
    },
  };
}

function readCanary(hidden: unknown): string {
  if (hidden && typeof hidden === 'object' && !Array.isArray(hidden)) {
    const canary = (hidden as { canary?: unknown }).canary;
    if (typeof canary === 'string') {
      return canary;
    }
  }
  return BOOKING_CANARY;
}

function publicQuestion(item: unknown, index: number): string {
  if (item && typeof item === 'object' && 'input' in item) {
    const input = (item as { input?: unknown }).input;
    if (typeof input === 'string') {
      return input;
    }
  }
  return `sample-${index}`;
}
