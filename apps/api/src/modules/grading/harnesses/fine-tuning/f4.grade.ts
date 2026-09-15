import { parseF4Payload } from './fine-tuning.payloads';
import type { F4Hidden, FineTuningGradeResult } from './fine-tuning.types';

export function parseF4Hidden(raw: unknown): F4Hidden {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('F4 hidden eval must be an object');
  }
  return raw as F4Hidden;
}

export function gradeF4(
  payload: unknown,
  hiddenRaw: unknown,
  publicItems: { question: string }[] = [],
): FineTuningGradeResult {
  const leaked = JSON.stringify(payload).includes('HIDDEN_EVAL');
  const parsed = parseF4Payload(payload);
  const hidden = parseF4Hidden(hiddenRaw);
  const started = Date.now();

  const adapterPass = parsed.adapterChoice === hidden.goldAdapter;
  const rationalePass = hidden.acceptedRationale.includes(parsed.rationale);
  const canaryPass = !leaked;
  const passed = adapterPass && rationalePass && canaryPass;
  const durationMs = Math.max(1, Date.now() - started);

  const result: FineTuningGradeResult = {
    verdict: passed ? 'pass' : 'fail',
    metrics: {
      adapter_ok: { value: adapterPass ? 1 : 0 },
      rationale_ok: { value: rationalePass ? 1 : 0 },
      no_canary: { value: canaryPass ? 1 : 0 },
    },
    gateResults: [
      gate('adapter-ok', 'adapter_ok', adapterPass ? 1 : 0, adapterPass),
      gate('rationale-ok', 'rationale_ok', rationalePass ? 1 : 0, rationalePass),
      gate('no-canary', 'no_canary', canaryPass ? 1 : 0, canaryPass),
    ],
    failureClasses: passed
      ? []
      : [
          ...(adapterPass ? [] : ['wrong-adapter']),
          ...(rationalePass ? [] : ['wrong-rationale']),
          ...(canaryPass ? [] : ['canary-leak']),
        ],
    scorecard: {
      trainingExamples: hidden.trainingExamples,
      adapterChoice: parsed.adapterChoice,
      rationale: parsed.rationale,
      wallClock: 'information',
      durationMs,
    },
    failingCases: leaked
      ? [{ question: 'canary', note: 'canary-leak' }]
      : passed
        ? []
        : [{ question: parsed.adapterChoice, note: 'Match adapter to dataset size and budget.' }],
    trace: {
      simulator: 'fine_tuning',
      payload: parsed as unknown as Record<string, unknown>,
      sandbox: { durationMs, wallClock: 'information' },
      k: 0,
      chunkCount: 0,
      tokensIn: 0,
      tokensOut: 0,
      costEurMicros: 0,
      queries: publicItems.slice(0, 2).map((item, index) => ({
        source: 'public' as const,
        question: item.question,
        retrieved: [
          {
            chunkId: `public-${index}`,
            docId: 'brief',
            score: 1,
            text: item.question.slice(0, 160),
          },
        ],
      })),
    },
  };

  if (JSON.stringify(result).includes('HIDDEN_EVAL')) {
    return {
      ...result,
      verdict: 'fail',
      failureClasses: [...new Set([...result.failureClasses, 'canary-leak'])],
      failingCases: [{ question: 'canary', note: 'canary-leak' }],
      metrics: { ...result.metrics, no_canary: { value: 0 } },
    };
  }
  return result;
}

function gate(
  id: string,
  metric: string,
  actual: number,
  passed: boolean,
): FineTuningGradeResult['gateResults'][number] {
  return { id, class: 'A', metric, op: 'eq', value: 1, actual, passed };
}
