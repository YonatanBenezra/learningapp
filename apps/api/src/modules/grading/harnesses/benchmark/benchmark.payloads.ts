import type {
  B2DeltaCause,
  B2Payload,
  B2RankingCall,
  B3DeltaCause,
  B3Payload,
  B3RankingCall,
  BenchmarkDeltaCause,
  BenchmarkPayload,
  BenchmarkRankingCall,
} from './benchmark.types';

const CALLS = new Set<BenchmarkRankingCall>(['noise', 'a_wins', 'b_wins']);
const CAUSES = new Set<BenchmarkDeltaCause>([
  'ci_overlap',
  'seed_or_wrapper',
  'better_model',
]);

export function parseBenchmarkPayload(payload: unknown): BenchmarkPayload {
  if (payload === null || typeof payload !== 'object') {
    throw new Error('Benchmark payload must be an object');
  }
  const record = payload as Record<string, unknown>;
  const rankingCall = record.rankingCall;
  const deltaCause = record.deltaCause;
  if (typeof rankingCall !== 'string' || !CALLS.has(rankingCall as BenchmarkRankingCall)) {
    throw new Error('rankingCall must be noise, a_wins, or b_wins');
  }
  if (typeof deltaCause !== 'string' || !CAUSES.has(deltaCause as BenchmarkDeltaCause)) {
    throw new Error(
      'deltaCause must be ci_overlap, seed_or_wrapper, or better_model',
    );
  }
  return {
    rankingCall: rankingCall as BenchmarkRankingCall,
    deltaCause: deltaCause as BenchmarkDeltaCause,
  };
}

const B2_CALLS = new Set<B2RankingCall>([
  'harness_only',
  'a_wins',
  'b_wins',
  'noise',
]);
const B2_CAUSES = new Set<B2DeltaCause>([
  'decode_params',
  'ci_overlap',
  'better_model',
]);

export function parseB2Payload(payload: unknown): B2Payload {
  const { rankingCall, deltaCause } = readCallCause(payload);
  if (!B2_CALLS.has(rankingCall as B2RankingCall)) {
    throw new Error(
      'rankingCall must be harness_only, a_wins, b_wins, or noise',
    );
  }
  if (!B2_CAUSES.has(deltaCause as B2DeltaCause)) {
    throw new Error(
      'deltaCause must be decode_params, ci_overlap, or better_model',
    );
  }
  return {
    rankingCall: rankingCall as B2RankingCall,
    deltaCause: deltaCause as B2DeltaCause,
  };
}

const B3_CALLS = new Set<B3RankingCall>([
  'contaminated',
  'a_wins',
  'b_wins',
  'noise',
]);
const B3_CAUSES = new Set<B3DeltaCause>([
  'eval_overlap',
  'ci_overlap',
  'better_model',
]);

export function parseB3Payload(payload: unknown): B3Payload {
  const { rankingCall, deltaCause } = readCallCause(payload);
  if (!B3_CALLS.has(rankingCall as B3RankingCall)) {
    throw new Error(
      'rankingCall must be contaminated, a_wins, b_wins, or noise',
    );
  }
  if (!B3_CAUSES.has(deltaCause as B3DeltaCause)) {
    throw new Error(
      'deltaCause must be eval_overlap, ci_overlap, or better_model',
    );
  }
  return {
    rankingCall: rankingCall as B3RankingCall,
    deltaCause: deltaCause as B3DeltaCause,
  };
}

function readCallCause(payload: unknown): {
  rankingCall: string;
  deltaCause: string;
} {
  if (payload === null || typeof payload !== 'object') {
    throw new Error('Benchmark payload must be an object');
  }
  const record = payload as Record<string, unknown>;
  if (typeof record.rankingCall !== 'string') {
    throw new Error('rankingCall is required');
  }
  if (typeof record.deltaCause !== 'string') {
    throw new Error('deltaCause is required');
  }
  return {
    rankingCall: record.rankingCall,
    deltaCause: record.deltaCause,
  };
}
