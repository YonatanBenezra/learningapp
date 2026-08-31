import type { FailingCase, GateResult, MetricValue } from '../rag/rag.types';

export type BenchmarkHarnessId = 'a' | 'b';

export type BenchmarkSlice = 'clean' | 'overlap';

export type BenchmarkItem = {
  id: string;
  gold: string;
  a: string;
  b: string;
  prompt?: string;
  canary?: boolean;
  slice?: BenchmarkSlice;
};

export type BenchmarkHarnessMeta = {
  id: string;
  seed: number;
  wrapper: string;
  decode?: string;
};

export type BenchmarkHidden = {
  harnessA: BenchmarkHarnessMeta;
  harnessB: BenchmarkHarnessMeta;
  items: BenchmarkItem[];
  canary?: { id: string; prompt: string };
};

export type BenchmarkRankingCall = 'noise' | 'a_wins' | 'b_wins';
export type BenchmarkDeltaCause =
  | 'ci_overlap'
  | 'seed_or_wrapper'
  | 'better_model';

export type BenchmarkPayload = {
  rankingCall: BenchmarkRankingCall;
  deltaCause: BenchmarkDeltaCause;
};

export type B2RankingCall = 'harness_only' | 'a_wins' | 'b_wins' | 'noise';
export type B2DeltaCause = 'decode_params' | 'ci_overlap' | 'better_model';
export type B2Payload = {
  rankingCall: B2RankingCall;
  deltaCause: B2DeltaCause;
};

export type B3RankingCall = 'contaminated' | 'a_wins' | 'b_wins' | 'noise';
export type B3DeltaCause = 'eval_overlap' | 'ci_overlap' | 'better_model';
export type B3Payload = {
  rankingCall: B3RankingCall;
  deltaCause: B3DeltaCause;
};

export type BenchmarkGradeResult = {
  verdict: 'pass' | 'fail';
  metrics: Record<string, MetricValue>;
  gateResults: GateResult[];
  failureClasses: string[];
  scorecard: Record<string, unknown>;
  failingCases: FailingCase[];
  trace: {
    simulator: 'benchmark';
    payload: { rankingCall: string; deltaCause: string };
    sandbox: {
      durationMs: number;
      wallClock: 'information';
    };
    k: number;
    chunkCount: number;
    tokensIn: number;
    tokensOut: number;
    costEurMicros: number;
    queries: {
      source: 'public' | 'failing_sample';
      question: string;
      retrieved: {
        chunkId: string;
        docId: string;
        score: number;
        text: string;
      }[];
    }[];
  };
};

export function isBenchmarkCanary(item: BenchmarkItem): boolean {
  return (
    item.canary === true ||
    (typeof item.prompt === 'string' && item.prompt.includes('HIDDEN_EVAL'))
  );
}
