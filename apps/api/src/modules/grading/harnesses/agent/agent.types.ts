import type { FailingCase, GateResult, MetricValue } from '../rag/rag.types';

export type AgentToolName = 'calculator' | 'json_store' | 'fixture_fetch' | 'none';

export type AgentItem = {
  id: string;
  question: string;
  /** Duplicate this instruction in tasks.json this many times (workspace only). */
  repeat?: number;
  gold: {
    tool: AgentToolName;
    args?: Record<string, unknown>;
    canary?: boolean;
  };
};

export type AgentPayload = {
  source: string;
  systemPrompt: string;
  toolSchemas: string;
};

export type AgentLearnerTask = {
  id: string;
  instruction: string;
};

export type AgentTraceStep = {
  index: number;
  kind: 'tool' | 'model';
  name: string;
  argsSummary: string;
  resultBytes: number;
  durationMs: number;
  ok: boolean;
  error?: string;
};

export type AgentCeilings = {
  maxSteps: number;
  maxToolCalls: number;
  stepsUsed: number;
  toolCallsUsed: number;
  killedLoop: boolean;
};

export type AgentGradeResult = {
  verdict: 'pass' | 'fail';
  metrics: Record<string, MetricValue>;
  gateResults: GateResult[];
  failureClasses: string[];
  scorecard: Record<string, unknown>;
  failingCases: FailingCase[];
  trace: {
    simulator: 'agent';
    execution: 'sandbox';
    payload: { sourceBytes: number };
    sandbox: {
      durationMs: number;
      memoryPeakMb: number | null;
      errorCode: string;
      exitCode: number | null;
      runtime: string;
    };
    steps: AgentTraceStep[];
    ceilings: AgentCeilings;
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

export function isAgentCanary(item: AgentItem): boolean {
  return item.gold.canary === true || JSON.stringify(item).includes('HIDDEN_EVAL');
}
