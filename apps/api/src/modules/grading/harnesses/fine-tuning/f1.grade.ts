import { parseF1Payload } from './fine-tuning.payloads';
import type { F1Hidden, FineTuningGradeResult } from './fine-tuning.types';

export function parseF1Hidden(raw: unknown): F1Hidden {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('F1 hidden eval must be an object');
  }
  return raw as F1Hidden;
}

export function gradeF1(
  payload: unknown,
  hiddenRaw: unknown,
  publicItems: { question: string }[] = [],
): FineTuningGradeResult {
  const leaked = JSON.stringify(payload).includes('HIDDEN_EVAL');
  const parsed = parseF1Payload(payload);
  const hidden = parseF1Hidden(hiddenRaw);
  const started = Date.now();

  const totalCalls = hidden.volumePerMonth * hidden.horizonMonths;
  const promptTotal =
    hidden.prompt.setupEur + totalCalls * hidden.prompt.perCallEur;
  const fineTuneTotal =
    hidden.fineTune.setupEur + totalCalls * hidden.fineTune.perCallEur;

  const approachPass = parsed.approachCall === hidden.goldApproach;
  const economicsPass = parsed.economicsCall === hidden.goldEconomics;
  const canaryPass = !leaked;
  const passed = approachPass && economicsPass && canaryPass;
  const durationMs = Math.max(1, Date.now() - started);

  const result: FineTuningGradeResult = {
    verdict: passed ? 'pass' : 'fail',
    metrics: {
      approach_ok: { value: approachPass ? 1 : 0 },
      economics_ok: { value: economicsPass ? 1 : 0 },
      no_canary: { value: canaryPass ? 1 : 0 },
    },
    gateResults: [
      gate('approach-ok', 'approach_ok', approachPass ? 1 : 0, approachPass),
      gate('economics-ok', 'economics_ok', economicsPass ? 1 : 0, economicsPass),
      gate('no-canary', 'no_canary', canaryPass ? 1 : 0, canaryPass),
    ],
    failureClasses: passed
      ? []
      : [
          ...(approachPass ? [] : ['wrong-approach']),
          ...(economicsPass ? [] : ['wrong-economics']),
          ...(canaryPass ? [] : ['canary-leak']),
        ],
    scorecard: {
      volumePerMonth: hidden.volumePerMonth,
      horizonMonths: hidden.horizonMonths,
      promptTotalEur: round2(promptTotal),
      fineTuneTotalEur: round2(fineTuneTotal),
      approachCall: parsed.approachCall,
      economicsCall: parsed.economicsCall,
      wallClock: 'information',
      durationMs,
      ...(passed
        ? {}
        : {
            message:
              'At this volume the one-off prompt path beats LoRA setup — run the six-month total before you pick fine-tuning.',
          }),
    },
    failingCases: leaked
      ? [{ question: 'canary', note: 'canary-leak' }]
      : passed
        ? []
        : [{ question: 'economics', note: 'Compare setup + (volume × months × per-call).' }],
    trace: {
      simulator: 'fine_tuning',
      payload: parsed as unknown as Record<string, unknown>,
      sandbox: { durationMs, wallClock: 'information' },
      k: 0,
      chunkCount: 0,
      tokensIn: 0,
      tokensOut: 0,
      costEurMicros: 0,
      queries: [
        {
          source: 'public',
          question: 'Prompt vs LoRA cost model',
          retrieved: [
            {
              chunkId: 'prompt',
              docId: 'prompt',
              score: promptTotal,
              text: `Prompt total €${round2(promptTotal)}`,
            },
            {
              chunkId: 'fine-tune',
              docId: 'fine-tune',
              score: fineTuneTotal,
              text: `Fine-tune total €${round2(fineTuneTotal)}`,
            },
          ],
        },
        ...publicItems.slice(0, 2).map((item, index) => ({
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
      ],
    },
  };

  return stripCanaryLeak(result);
}

function gate(
  id: string,
  metric: string,
  actual: number,
  passed: boolean,
): FineTuningGradeResult['gateResults'][number] {
  return { id, class: 'A', metric, op: 'eq', value: 1, actual, passed };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function stripCanaryLeak(result: FineTuningGradeResult): FineTuningGradeResult {
  if (!JSON.stringify(result).includes('HIDDEN_EVAL')) {
    return result;
  }
  return {
    ...result,
    verdict: 'fail',
    failureClasses: [...new Set([...result.failureClasses, 'canary-leak'])],
    failingCases: [{ question: 'canary', note: 'canary-leak' }],
    metrics: { ...result.metrics, no_canary: { value: 0 } },
  };
}
