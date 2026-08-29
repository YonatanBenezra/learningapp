import type {
  SandboxJobInput,
  SandboxJobResult,
} from '../../../sandbox/sandbox.types';
import type { CorpusDoc } from '../rag/chunking';
import {
  answerableHidden,
  expandGoldSpan,
  FAILING_SAMPLE_LIMIT,
  publicTraceItems,
} from '../rag/rag.shared';
import { chunkContainsSpan } from '../rag/retrieve';
import type { HiddenItem, TraceQuery } from '../rag/rag.types';
import { learnerInputJson } from './sandbox.input';
import type { SandboxPayload } from './sandbox.payloads';
import type { SandboxGradeResult, SandboxRetrieved } from './sandbox.types';

const K = 5;
const THRESHOLD = 0.8;

export type SandboxExecutor = (
  input: SandboxJobInput,
) => Promise<SandboxJobResult>;

export async function gradeSandboxRetriever(
  payload: SandboxPayload,
  docs: CorpusDoc[],
  hidden: HiddenItem[],
  publicItems: { question: string }[],
  execute: SandboxExecutor,
  limits?: { maxWallClockS?: number; maxMemoryMb?: number },
): Promise<SandboxGradeResult> {
  const executed = await execute({
    source: payload.source,
    workspaceFiles: { 'input.json': learnerInputJson(docs, hidden) },
    maxWallClockS: limits?.maxWallClockS,
    maxMemoryMb: limits?.maxMemoryMb,
  });

  const answerable = answerableHidden(hidden);
  if (!executed.ok) {
    return sandboxFailure(executed, payload, answerable.length, publicItems);
  }

  const retrieved = parseResults(executed.stdout);
  const misses: SandboxGradeResult['failingCases'] = [];
  const failingQueries: TraceQuery[] = [];
  let hits = 0;
  for (const item of answerable) {
    const row = retrieved.get(item.id);
    const passages = row?.passages.slice(0, K) ?? [];
    const gold = expandGoldSpan(
      docs,
      item.goldDocId as string,
      item.goldSpan as string,
    );
    const hit = passages.some((text) => chunkContainsSpan(text, gold));
    if (hit) {
      hits += 1;
    } else if (misses.length < FAILING_SAMPLE_LIMIT) {
      misses.push({
        question: item.question,
        goldSpan: gold,
        retrieved: passages.map((text) => text.slice(0, 220)),
      });
      failingQueries.push({
        source: 'failing_sample',
        question: item.question,
        retrieved: passages.map((text, index) => ({
          chunkId: `${item.id}:${index}`,
          docId: 'sandbox',
          score: K - index,
          text: text.slice(0, 400),
        })),
      });
    }
  }

  const total = answerable.length;
  const recall = total === 0 ? 0 : hits / total;
  const passed = recall >= THRESHOLD;
  return {
    verdict: passed ? 'pass' : 'fail',
    metrics: {
      recall_at_5: { value: recall, hits, total },
    },
    gateResults: [
      {
        id: 'recall-at-5',
        class: 'A',
        metric: 'recall@5',
        op: 'gte',
        value: THRESHOLD,
        actual: recall,
        passed,
      },
    ],
    failureClasses: passed ? [] : ['retrieval-quality'],
    scorecard: {
      recallAt5: recall,
      threshold: THRESHOLD,
      durationMs: executed.durationMs,
      memoryPeakMb: executed.memoryPeakMb,
    },
    failingCases: misses,
    trace: {
      simulator: 'rag',
      execution: 'sandbox',
      payload: { sourceBytes: payload.source.length },
      sandbox: {
        durationMs: executed.durationMs,
        memoryPeakMb: executed.memoryPeakMb,
        errorCode: executed.errorCode,
        exitCode: executed.exitCode,
        runtime: executed.runtime,
      },
      k: K,
      chunkCount: docs.length,
      tokensIn: 0,
      tokensOut: 0,
      costEurMicros: 0,
      queries: [
        ...publicTraceItems(publicItems).map((item) => ({
          source: 'public' as const,
          question: item.question,
          retrieved: [],
        })),
        ...failingQueries,
      ],
    },
  };
}

function sandboxFailure(
  executed: SandboxJobResult,
  payload: SandboxPayload,
  total: number,
  publicItems: { question: string }[],
): SandboxGradeResult {
  const errorCode = executed.errorCode;
  return {
    verdict: 'fail',
    metrics: {
      recall_at_5: { value: 0, hits: 0, total },
    },
    gateResults: [
      {
        id: 'recall-at-5',
        class: 'A',
        metric: 'recall@5',
        op: 'gte',
        value: THRESHOLD,
        actual: 0,
        passed: false,
      },
    ],
    failureClasses: [errorCode],
    scorecard: {
      sandboxError: errorCode,
      durationMs: executed.durationMs,
      memoryPeakMb: executed.memoryPeakMb,
    },
    failingCases: [
      {
        question: 'sandbox execution',
        note: executed.stderr.slice(0, 400) || errorCode,
      },
    ],
    trace: {
      simulator: 'rag',
      execution: 'sandbox',
      payload: { sourceBytes: payload.source.length },
      sandbox: {
        durationMs: executed.durationMs,
        memoryPeakMb: executed.memoryPeakMb,
        errorCode,
        exitCode: executed.exitCode,
        runtime: executed.runtime,
      },
      k: K,
      chunkCount: 0,
      tokensIn: 0,
      tokensOut: 0,
      costEurMicros: 0,
      queries: publicTraceItems(publicItems).map((item) => ({
        source: 'public' as const,
        question: item.question,
        retrieved: [],
      })),
    },
  };
}

function parseResults(stdout: string): Map<string, SandboxRetrieved> {
  const map = new Map<string, SandboxRetrieved>();
  const trimmed = stdout.trim();
  if (!trimmed) {
    return map;
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    const rows = Array.isArray(parsed)
      ? parsed
      : parsed &&
          typeof parsed === 'object' &&
          Array.isArray((parsed as { results?: unknown }).results)
        ? (parsed as { results: unknown[] }).results
        : [];
    for (const row of rows) {
      if (!row || typeof row !== 'object') {
        continue;
      }
      const record = row as Record<string, unknown>;
      if (typeof record.id !== 'string') {
        continue;
      }
      const passages = Array.isArray(record.passages)
        ? record.passages.filter(
            (item): item is string => typeof item === 'string',
          )
        : [];
      map.set(record.id, { id: record.id, passages });
    }
  } catch {
    return map;
  }
  return map;
}
