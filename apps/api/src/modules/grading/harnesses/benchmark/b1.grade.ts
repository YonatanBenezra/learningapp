import { intervalsOverlap, wilsonInterval } from '../../metrics/wilson';
import { parseBenchmarkPayload } from './benchmark.payloads';
import {
  isBenchmarkCanary,
  type BenchmarkGradeResult,
  type BenchmarkHidden,
  type BenchmarkItem,
} from './benchmark.types';

const NOISE_CAUSES = new Set(['ci_overlap', 'seed_or_wrapper']);

export function parseBenchmarkHidden(raw: unknown): BenchmarkHidden {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Benchmark hidden eval must be an object');
  }
  const record = raw as Record<string, unknown>;
  if (!Array.isArray(record.items)) {
    throw new Error('Benchmark hidden eval is missing items');
  }
  return record as BenchmarkHidden;
}

export function gradeB1(
  payload: unknown,
  hiddenRaw: unknown,
  publicItems: { question: string }[] = [],
): BenchmarkGradeResult {
  const leaked = JSON.stringify(payload).includes('HIDDEN_EVAL');
  const payloadParsed = parseBenchmarkPayload(payload);
  const hidden = parseBenchmarkHidden(hiddenRaw);
  const usable = hidden.items.filter((item) => !isBenchmarkCanary(item));
  const started = Date.now();
  const scoredA = scoreHarness(usable, 'a');
  const scoredB = scoreHarness(usable, 'b');
  const ciA = wilsonInterval(scoredA.hits, scoredA.n);
  const ciB = wilsonInterval(scoredB.hits, scoredB.n);
  const overlap = intervalsOverlap(ciA, ciB);
  const durationMs = Math.max(1, Date.now() - started);

  const rankingPass = payloadParsed.rankingCall === 'noise';
  const causePass = NOISE_CAUSES.has(payloadParsed.deltaCause);
  const overlapPass = overlap;
  const canaryPass = !leaked;
  const passed = rankingPass && causePass && overlapPass && canaryPass;

  const result: BenchmarkGradeResult = {
    verdict: passed ? 'pass' : 'fail',
    metrics: {
      ranking_noise: { value: rankingPass ? 1 : 0 },
      cause_ok: { value: causePass ? 1 : 0 },
      ci_overlap: { value: overlapPass ? 1 : 0 },
      no_canary: { value: canaryPass ? 1 : 0 },
      acc_a: { value: ciA.p, hits: scoredA.hits, total: scoredA.n },
      acc_b: { value: ciB.p, hits: scoredB.hits, total: scoredB.n },
    },
    gateResults: [
      gate('ranking-noise', 'ranking_noise', rankingPass ? 1 : 0, rankingPass),
      gate('cause-ok', 'cause_ok', causePass ? 1 : 0, causePass),
      gate('ci-overlap', 'ci_overlap', overlapPass ? 1 : 0, overlapPass),
      gate('no-canary', 'no_canary', canaryPass ? 1 : 0, canaryPass),
    ],
    failureClasses: passed
      ? []
      : [
          ...(rankingPass ? [] : ['ranking-win']),
          ...(causePass ? [] : ['wrong-cause']),
          ...(overlapPass ? [] : ['ci-separated']),
          ...(canaryPass ? [] : ['canary-leak']),
        ],
    scorecard: {
      accA: round4(ciA.p),
      accB: round4(ciB.p),
      n: scoredA.n,
      ciA: { low: round4(ciA.low), high: round4(ciA.high) },
      ciB: { low: round4(ciB.low), high: round4(ciB.high) },
      ciOverlap: overlap,
      wallClock: 'information',
      durationMs,
      ...(passed
        ? {}
        : {
            message: rankingPass
              ? 'The delta is noise only if you also name CI overlap or seed/wrapper — not a better model.'
              : 'A raw accuracy delta is not a ranking win when Wilson CIs overlap.',
          }),
    },
    failingCases: leaked
      ? [{ question: 'canary', note: 'canary-leak' }]
      : passed
        ? []
        : [
            {
              question: 'delta',
              note: overlap
                ? 'CIs overlap — treat the headline % as noise, not a model win.'
                : 'Fixture CIs did not overlap.',
            },
          ],
    trace: {
      simulator: 'benchmark',
      payload: {
        rankingCall: payloadParsed.rankingCall,
        deltaCause: payloadParsed.deltaCause,
      },
      sandbox: { durationMs, wallClock: 'information' },
      k: 0,
      chunkCount: 0,
      tokensIn: 0,
      tokensOut: 0,
      costEurMicros: 0,
      queries: [
        {
          source: 'public',
          question: `Harness A (${hidden.harnessA.wrapper} · seed ${hidden.harnessA.seed})`,
          retrieved: [
            {
              chunkId: 'a',
              docId: hidden.harnessA.id,
              score: ciA.p,
              text: `${scoredA.hits}/${scoredA.n} · Wilson [${round4(ciA.low)}, ${round4(ciA.high)}]`,
            },
          ],
        },
        {
          source: 'public',
          question: `Harness B (${hidden.harnessB.wrapper} · seed ${hidden.harnessB.seed})`,
          retrieved: [
            {
              chunkId: 'b',
              docId: hidden.harnessB.id,
              score: ciB.p,
              text: `${scoredB.hits}/${scoredB.n} · Wilson [${round4(ciB.low)}, ${round4(ciB.high)}]`,
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

function scoreHarness(
  items: BenchmarkItem[],
  side: 'a' | 'b',
): { hits: number; n: number } {
  let hits = 0;
  for (const item of items) {
    if (item[side] === item.gold) {
      hits += 1;
    }
  }
  return { hits, n: items.length };
}

function gate(
  id: string,
  metric: string,
  actual: number,
  passed: boolean,
): BenchmarkGradeResult['gateResults'][number] {
  return {
    id,
    class: 'A',
    metric,
    op: 'eq',
    value: 1,
    actual,
    passed,
  };
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
