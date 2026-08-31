import { parseB3Payload } from './benchmark.payloads';
import {
  gate,
  intervalLines,
  pairIntervals,
  parseBenchmarkHidden,
  payloadLeaked,
  round4,
  scoreSlice,
  stripCanaryLeak,
  usableItems,
} from './benchmark.shared';
import type { BenchmarkGradeResult } from './benchmark.types';

export function gradeB3(
  payload: unknown,
  hiddenRaw: unknown,
  publicItems: { question: string }[] = [],
): BenchmarkGradeResult {
  const leaked = payloadLeaked(payload);
  const parsed = parseB3Payload(payload);
  const hidden = parseBenchmarkHidden(hiddenRaw);
  const usable = usableItems(hidden);
  const started = Date.now();
  const scored = pairIntervals(usable);
  const clean = scoreSlice(usable, 'clean');
  const overlap = scoreSlice(usable, 'overlap');
  const durationMs = Math.max(1, Date.now() - started);

  const rankingPass = parsed.rankingCall === 'contaminated';
  const causePass = parsed.deltaCause === 'eval_overlap';
  const canaryPass = !leaked;
  const passed = rankingPass && causePass && canaryPass;

  const result: BenchmarkGradeResult = {
    verdict: passed ? 'pass' : 'fail',
    metrics: {
      ranking_contaminated: { value: rankingPass ? 1 : 0 },
      cause_ok: { value: causePass ? 1 : 0 },
      no_canary: { value: canaryPass ? 1 : 0 },
      acc_a: { value: scored.ciA.p, hits: scored.a.hits, total: scored.a.n },
      acc_b: { value: scored.ciB.p, hits: scored.b.hits, total: scored.b.n },
      acc_clean_a: {
        value: clean.a.n ? clean.a.hits / clean.a.n : 0,
        hits: clean.a.hits,
        total: clean.a.n,
      },
      acc_clean_b: {
        value: clean.b.n ? clean.b.hits / clean.b.n : 0,
        hits: clean.b.hits,
        total: clean.b.n,
      },
      acc_overlap_a: {
        value: overlap.a.n ? overlap.a.hits / overlap.a.n : 0,
        hits: overlap.a.hits,
        total: overlap.a.n,
      },
      acc_overlap_b: {
        value: overlap.b.n ? overlap.b.hits / overlap.b.n : 0,
        hits: overlap.b.hits,
        total: overlap.b.n,
      },
    },
    gateResults: [
      gate(
        'ranking-contaminated',
        'ranking_contaminated',
        rankingPass ? 1 : 0,
        rankingPass,
      ),
      gate('cause-ok', 'cause_ok', causePass ? 1 : 0, causePass),
      gate('no-canary', 'no_canary', canaryPass ? 1 : 0, canaryPass),
    ],
    failureClasses: passed
      ? []
      : [
          ...(rankingPass ? [] : ['ranking-win']),
          ...(causePass ? [] : ['wrong-cause']),
          ...(canaryPass ? [] : ['canary-leak']),
        ],
    scorecard: {
      accA: round4(scored.ciA.p),
      accB: round4(scored.ciB.p),
      n: scored.a.n,
      ciA: { low: round4(scored.ciA.low), high: round4(scored.ciA.high) },
      ciB: { low: round4(scored.ciB.low), high: round4(scored.ciB.high) },
      ciOverlap: scored.overlap,
      seedA: hidden.harnessA.seed,
      seedB: hidden.harnessB.seed,
      accCleanA: clean.a.n ? round4(clean.a.hits / clean.a.n) : 0,
      accCleanB: clean.b.n ? round4(clean.b.hits / clean.b.n) : 0,
      accOverlapA: overlap.a.n ? round4(overlap.a.hits / overlap.a.n) : 0,
      accOverlapB: overlap.b.n ? round4(overlap.b.hits / overlap.b.n) : 0,
      wallClock: 'information',
      durationMs,
      message: passed
        ? `Clean slice is tied ${clean.a.hits}/${clean.a.n}. The lift sits on the ${overlap.a.n} overlap tickets (${overlap.a.hits}/${overlap.a.n} vs ${overlap.b.hits}/${overlap.b.n}). Contamination, not a better model.`
        : rankingPass
          ? 'Name the overlap between train-like shots and eval items — not CI noise or a better checkpoint.'
          : 'Overall CIs can overlap while the overlap slice does not. Read the slices, not the headline %.',
    },
    failingCases: leaked
      ? [{ question: 'canary', note: 'canary-leak' }]
      : passed
        ? []
        : [
            {
              question: 'slice',
              note: 'Clean-slice accuracy is tied. The delta is on tickets that look like the few-shot dump.',
            },
          ],
    trace: {
      simulator: 'benchmark',
      payload: {
        rankingCall: parsed.rankingCall,
        deltaCause: parsed.deltaCause,
      },
      sandbox: { durationMs, wallClock: 'information' },
      k: 0,
      chunkCount: 0,
      tokensIn: 0,
      tokensOut: 0,
      costEurMicros: 0,
      queries: [
        ...intervalLines(hidden, scored),
        {
          source: 'public',
          question: 'Clean slice (no train/eval overlap)',
          retrieved: [
            {
              chunkId: 'clean',
              docId: 'clean',
              score: clean.a.n ? clean.a.hits / clean.a.n : 0,
              text: `A ${clean.a.hits}/${clean.a.n} · B ${clean.b.hits}/${clean.b.n}`,
            },
          ],
        },
        {
          source: 'public',
          question: 'Overlap slice (eval-like train shots)',
          retrieved: [
            {
              chunkId: 'overlap',
              docId: 'overlap',
              score: overlap.b.n ? overlap.b.hits / overlap.b.n : 0,
              text: `A ${overlap.a.hits}/${overlap.a.n} · B ${overlap.b.hits}/${overlap.b.n}`,
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
