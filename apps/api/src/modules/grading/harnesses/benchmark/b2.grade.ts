import { parseB2Payload } from './benchmark.payloads';
import {
  gate,
  intervalLines,
  pairIntervals,
  parseBenchmarkHidden,
  payloadLeaked,
  round4,
  stripCanaryLeak,
  usableItems,
} from './benchmark.shared';
import type { BenchmarkGradeResult } from './benchmark.types';

export function gradeB2(
  payload: unknown,
  hiddenRaw: unknown,
  publicItems: { question: string }[] = [],
): BenchmarkGradeResult {
  const leaked = payloadLeaked(payload);
  const parsed = parseB2Payload(payload);
  const hidden = parseBenchmarkHidden(hiddenRaw);
  const usable = usableItems(hidden);
  const started = Date.now();
  const scored = pairIntervals(usable);
  const durationMs = Math.max(1, Date.now() - started);

  const rankingPass = parsed.rankingCall === 'harness_only';
  const causePass = parsed.deltaCause === 'decode_params';
  const canaryPass = !leaked;
  const passed = rankingPass && causePass && canaryPass;

  const result: BenchmarkGradeResult = {
    verdict: passed ? 'pass' : 'fail',
    metrics: {
      ranking_harness: { value: rankingPass ? 1 : 0 },
      cause_ok: { value: causePass ? 1 : 0 },
      no_canary: { value: canaryPass ? 1 : 0 },
      acc_a: { value: scored.ciA.p, hits: scored.a.hits, total: scored.a.n },
      acc_b: { value: scored.ciB.p, hits: scored.b.hits, total: scored.b.n },
      ci_separated: { value: scored.overlap ? 0 : 1 },
    },
    gateResults: [
      gate('ranking-harness', 'ranking_harness', rankingPass ? 1 : 0, rankingPass),
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
      decodeA: hidden.harnessA.decode ?? hidden.harnessA.id,
      decodeB: hidden.harnessB.decode ?? hidden.harnessB.id,
      wallClock: 'information',
      durationMs,
      message: passed
        ? `Same checkpoint, same seed. Greedy ${scored.a.hits}/${scored.a.n} vs T=0.9 ${scored.b.hits}/${scored.b.n}. Wilson CIs do not overlap — still decode variance, not a model ranking.`
        : rankingPass
          ? 'Decode is the right family — do not fall back to CI overlap or “better model”.'
          : 'Separated CIs on the same checkpoint are harness variance (decode), not a ranking win.',
    },
    failingCases: leaked
      ? [{ question: 'canary', note: 'canary-leak' }]
      : passed
        ? []
        : [
            {
              question: 'decode',
              note: scored.overlap
                ? 'Fixture CIs overlapped — check the frozen traces.'
                : 'CIs separate because temperature changed, not because B is a different model.',
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
      queries: intervalLines(
        hidden,
        scored,
        publicItems.slice(0, 2).map((item, index) => ({
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
      ),
    },
  };

  return stripCanaryLeak(result);
}
