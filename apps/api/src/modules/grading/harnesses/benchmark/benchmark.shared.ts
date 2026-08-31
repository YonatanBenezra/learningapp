import { intervalsOverlap, wilsonInterval } from '../../metrics/wilson';
import {
  isBenchmarkCanary,
  type BenchmarkGradeResult,
  type BenchmarkHidden,
  type BenchmarkItem,
  type BenchmarkSlice,
} from './benchmark.types';

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

export function usableItems(hidden: BenchmarkHidden): BenchmarkItem[] {
  return hidden.items.filter((item) => !isBenchmarkCanary(item));
}

export function scoreHarness(
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

export function scoreSlice(
  items: BenchmarkItem[],
  slice: BenchmarkSlice,
): { a: { hits: number; n: number }; b: { hits: number; n: number } } {
  const sliced = items.filter((item) => item.slice === slice);
  return { a: scoreHarness(sliced, 'a'), b: scoreHarness(sliced, 'b') };
}

export function pairIntervals(items: BenchmarkItem[]) {
  const a = scoreHarness(items, 'a');
  const b = scoreHarness(items, 'b');
  const ciA = wilsonInterval(a.hits, a.n);
  const ciB = wilsonInterval(b.hits, b.n);
  return {
    a,
    b,
    ciA,
    ciB,
    overlap: intervalsOverlap(ciA, ciB),
  };
}

export function payloadLeaked(payload: unknown): boolean {
  return JSON.stringify(payload).includes('HIDDEN_EVAL');
}

export function gate(
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

export function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

export function stripCanaryLeak(
  result: BenchmarkGradeResult,
): BenchmarkGradeResult {
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

export function intervalLines(
  hidden: BenchmarkHidden,
  scored: ReturnType<typeof pairIntervals>,
  extra: BenchmarkGradeResult['trace']['queries'] = [],
): BenchmarkGradeResult['trace']['queries'] {
  return [
    {
      source: 'public',
      question: `Harness A (${hidden.harnessA.wrapper}${hidden.harnessA.decode ? ` · ${hidden.harnessA.decode}` : ''} · seed ${hidden.harnessA.seed})`,
      retrieved: [
        {
          chunkId: 'a',
          docId: hidden.harnessA.id,
          score: scored.ciA.p,
          text: `${scored.a.hits}/${scored.a.n} · Wilson [${round4(scored.ciA.low)}, ${round4(scored.ciA.high)}]`,
        },
      ],
    },
    {
      source: 'public',
      question: `Harness B (${hidden.harnessB.wrapper}${hidden.harnessB.decode ? ` · ${hidden.harnessB.decode}` : ''} · seed ${hidden.harnessB.seed})`,
      retrieved: [
        {
          chunkId: 'b',
          docId: hidden.harnessB.id,
          score: scored.ciB.p,
          text: `${scored.b.hits}/${scored.b.n} · Wilson [${round4(scored.ciB.low)}, ${round4(scored.ciB.high)}]`,
        },
      ],
    },
    ...extra,
  ];
}
