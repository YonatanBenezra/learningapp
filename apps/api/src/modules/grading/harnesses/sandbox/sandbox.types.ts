import type { SandboxErrorCode } from '../../../sandbox/sandbox.constants';
import type {
  FailingCase,
  GateResult,
  MetricValue,
  TraceQuery,
} from '../rag/rag.types';

export type SandboxMetrics = {
  durationMs: number;
  memoryPeakMb: number | null;
  errorCode: SandboxErrorCode;
  exitCode: number | null;
  runtime: 'runsc' | 'runc';
};

export type SandboxTrace = {
  simulator: 'rag';
  execution: 'sandbox';
  payload: { sourceBytes: number };
  sandbox: SandboxMetrics;
  k: number;
  chunkCount: number;
  tokensIn: number;
  tokensOut: number;
  costEurMicros: number;
  queries: TraceQuery[];
};

export type SandboxGradeResult = {
  verdict: 'pass' | 'fail';
  metrics: Record<string, MetricValue>;
  gateResults: GateResult[];
  failureClasses: string[];
  scorecard: Record<string, unknown>;
  failingCases: FailingCase[];
  trace: SandboxTrace;
};

export type SandboxRetrieved = {
  id: string;
  passages: string[];
};
