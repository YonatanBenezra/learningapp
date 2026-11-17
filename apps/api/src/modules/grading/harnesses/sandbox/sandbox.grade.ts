import { SANDBOX_ERROR_CODES } from '../../../sandbox/sandbox.constants';
import type {
  SandboxJobInput,
  SandboxJobResult,
} from '../../../sandbox/sandbox.types';
import { estimateTokens } from '../../gateway/pricing';
import type { CorpusDoc } from '../rag/chunking';
import {
  answerableHidden,
  costEvidence,
  EvalLedger,
  expandGoldSpan,
  gateThreshold,
  publicTraceItems,
} from '../rag/rag.shared';
import { chunkContainsSpan } from '../rag/retrieve';
import type { HiddenItem, TraceQuery } from '../rag/rag.types';
import { learnerInputJson } from './sandbox.input';
import type { SandboxPayload } from './sandbox.payloads';
import type { SandboxGradeResult, SandboxRetrieved } from './sandbox.types';

const K = 5;
const DEFAULT_THRESHOLD = 0.8;
/** Used when an exercise declares no context budget; whole-corpus dumps fail it. */
const DEFAULT_CONTEXT_TOKENS = 300;

/** Lowercase, punctuation-insensitive form used to match passages to docs. */
function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * A passage counts only if it is a contiguous span of ONE corpus document
 * (title + body, punctuation and case ignored). Concatenating documents, or
 * inventing text, is not retrieval.
 */
export function passageMatcher(docs: CorpusDoc[]): (text: string) => boolean {
  const docOf = passageDocs(docs);
  return (text: string) => docOf(text) !== null;
}

/** The id of the one document a passage is a span of, or null. */
export function passageDocs(
  docs: CorpusDoc[],
): (text: string) => string | null {
  const bodies = docs.map((doc) => ({
    id: doc.id,
    body: normalizeForMatch(`${doc.title} ${doc.text}`),
  }));
  return (text: string) => {
    const needle = normalizeForMatch(text);
    if (needle.length === 0) {
      return null;
    }
    return bodies.find((row) => row.body.includes(needle))?.id ?? null;
  };
}

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
  gates?: unknown,
): Promise<SandboxGradeResult> {
  const threshold = gateThreshold(gates, 'recall@5', DEFAULT_THRESHOLD);
  const contextCeiling = gateThreshold(
    gates,
    'mean_context_tokens',
    DEFAULT_CONTEXT_TOKENS,
  );
  const executed = await execute({
    source: payload.source,
    workspaceFiles: { 'input.json': learnerInputJson(docs, hidden) },
    maxWallClockS: limits?.maxWallClockS,
    maxMemoryMb: limits?.maxMemoryMb,
  });

  const answerable = answerableHidden(hidden);
  if (!executed.ok) {
    return sandboxFailure(
      executed,
      payload,
      answerable.length,
      publicItems,
      threshold,
      await crashNote(executed, payload, docs, publicItems, execute, limits),
    );
  }

  const retrieved = parseResults(executed.stdout);
  const docOf = passageDocs(docs);
  const fromCorpus = (text: string) => docOf(text) !== null;
  const misses: SandboxGradeResult['failingCases'] = [];
  const failingQueries: TraceQuery[] = [];
  const ledger = new EvalLedger();
  const perQuery: { tokens: number; chunks: number }[] = [];
  let hits = 0;
  let passageCount = 0;
  let invalidPassages = 0;
  let contextTokenSum = 0;
  for (const item of answerable) {
    const row = retrieved.get(item.id);
    const returned = row?.passages.slice(0, K) ?? [];
    const passages = returned.filter((text) => fromCorpus(text));
    passageCount += returned.length;
    invalidPassages += returned.length - passages.length;
    // Budget counts everything the program returned, valid or not.
    const tokens =
      returned.length === 0 ? 0 : estimateTokens(returned.join('\n\n'));
    contextTokenSum += tokens;
    perQuery.push({ tokens, chunks: returned.length });
    const gold = expandGoldSpan(
      docs,
      item.goldDocId as string,
      item.goldSpan as string,
    );
    const hit = passages.some((text) => chunkContainsSpan(text, gold));
    ledger.record(
      item,
      hit,
      hit
        ? null
        : {
            code:
              passages.length < returned.length
                ? 'passage-not-from-corpus'
                : passages.some((text) => docOf(text) === item.goldDocId)
                  ? 'right-doc-wrong-span'
                  : 'gold-doc-not-returned',
          },
    );
    if (hit) {
      hits += 1;
    } else if (ledger.reveal(item)) {
      misses.push({
        question: item.question,
        goldSpan: gold,
        // Only real corpus spans are echoed: the program can read every
        // hidden question, so anything else it prints could smuggle holdout
        // questions out through a feedback miss.
        retrieved: [
          ...passages.map((text) => text.slice(0, 220)),
          ...(passages.length < returned.length
            ? [
                `[${returned.length - passages.length} passage(s) not from the corpus, not shown]`,
              ]
            : []),
        ],
        ...(passages.length < returned.length
          ? { note: 'passage-not-from-corpus' }
          : {}),
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
  const meanContextTokens = total === 0 ? 0 : contextTokenSum / total;
  const validShare =
    passageCount === 0 ? 1 : (passageCount - invalidPassages) / passageCount;
  const recallPass = recall >= threshold;
  const contextPass = meanContextTokens <= contextCeiling;
  const corpusPass = invalidPassages === 0;
  const passed = recallPass && contextPass && corpusPass;
  ledger.setCost(costEvidence(perQuery, contextCeiling));
  const failureClasses: string[] = [];
  if (!corpusPass) {
    failureClasses.push('passage-not-from-corpus');
  }
  if (!contextPass) {
    failureClasses.push('context-over-budget');
  }
  if (!recallPass) {
    failureClasses.push(...ledger.topCauses());
  }
  return {
    verdict: passed ? 'pass' : 'fail',
    metrics: {
      recall_at_5: { value: recall, hits, total },
      mean_context_tokens: { value: meanContextTokens },
      passages_from_corpus: {
        value: validShare,
        invalid: invalidPassages,
        total: passageCount,
      },
    },
    gateResults: [
      {
        id: 'recall-at-5',
        class: 'A',
        metric: 'recall@5',
        op: 'gte',
        value: threshold,
        actual: recall,
        passed: recallPass,
      },
      {
        id: 'mean-context-tokens',
        class: 'A',
        metric: 'mean_context_tokens',
        op: 'lte',
        value: contextCeiling,
        actual: meanContextTokens,
        passed: contextPass,
      },
      {
        id: 'passages-from-corpus',
        class: 'A',
        metric: 'passages_from_corpus',
        op: 'eq',
        value: 1,
        actual: validShare,
        passed: corpusPass,
      },
    ],
    failureClasses: passed ? [] : [...new Set(failureClasses)],
    scorecard: {
      recallAt5: recall,
      threshold,
      meanContextTokens,
      contextCeiling,
      invalidPassages,
      breakdown: ledger.breakdown(),
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
      tokensIn: Math.round(contextTokenSum),
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

/** Errors where the learner's program never produced output of its own. */
const INFRA_ERRORS = new Set<string>([
  SANDBOX_ERROR_CODES.RUNTIME_UNAVAILABLE,
  SANDBOX_ERROR_CODES.EGRESS_BLOCKED,
]);

/**
 * What to show when the hidden run crashed. The hidden run's stderr is never
 * echoed: the program reads every hidden question and could print holdout
 * questions in an error message. Instead the program is re-run on the public
 * samples only, and that run's error output (which holds no hidden data) is
 * shown when it fails too.
 */
async function crashNote(
  executed: SandboxJobResult,
  payload: SandboxPayload,
  docs: CorpusDoc[],
  publicItems: { question: string }[],
  execute: SandboxExecutor,
  limits?: { maxWallClockS?: number; maxMemoryMb?: number },
): Promise<string> {
  if (INFRA_ERRORS.has(executed.errorCode) || publicItems.length === 0) {
    return executed.errorCode;
  }
  const publicAsQuestions: HiddenItem[] = publicItems.map((item, index) => ({
    id: `public-${index + 1}`,
    question: item.question,
    answerable: true,
    goldAnswer: null,
    goldDocId: null,
    goldSpan: null,
  }));
  const dryRun = await execute({
    source: payload.source,
    workspaceFiles: {
      'input.json': learnerInputJson(docs, publicAsQuestions),
    },
    maxWallClockS: limits?.maxWallClockS,
    maxMemoryMb: limits?.maxMemoryMb,
  });
  if (!dryRun.ok) {
    return `Also fails on the public samples (${dryRun.errorCode}):\n${dryRun.stderr.slice(0, 400)}`;
  }
  return `Your program crashed (${executed.errorCode}) on the hidden questions but runs on the public samples. Error output from the hidden run is never shown; check edge cases such as empty or unusual questions.`;
}

function sandboxFailure(
  executed: SandboxJobResult,
  payload: SandboxPayload,
  total: number,
  publicItems: { question: string }[],
  threshold: number,
  note: string,
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
        value: threshold,
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
        note,
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
