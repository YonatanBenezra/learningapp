import { parseF2Payload } from './fine-tuning.payloads';
import {
  isFineTuningCanary,
  type F2Hidden,
  type FineTuningGradeResult,
} from './fine-tuning.types';

export function parseF2Hidden(raw: unknown): F2Hidden {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('F2 hidden eval must be an object');
  }
  const record = raw as Record<string, unknown>;
  if (!Array.isArray(record.rows) || !Array.isArray(record.goldRowIds)) {
    throw new Error('F2 hidden eval is missing rows or goldRowIds');
  }
  return record as F2Hidden;
}

export function gradeF2(
  payload: unknown,
  hiddenRaw: unknown,
  publicItems: { question: string }[] = [],
): FineTuningGradeResult {
  const leaked = JSON.stringify(payload).includes('HIDDEN_EVAL');
  const parsed = parseF2Payload(payload);
  const hidden = parseF2Hidden(hiddenRaw);
  const rows = hidden.rows.filter((row) => !isFineTuningCanary(row));
  const started = Date.now();

  const issuePass = parsed.issue === hidden.goldIssue;
  const rowsPass =
    hidden.goldRowIds.every((id) => parsed.rowIds.includes(id)) &&
    parsed.rowIds.every((id) => hidden.goldRowIds.includes(id));
  const canaryPass = !leaked;
  const passed = issuePass && rowsPass && canaryPass;
  const durationMs = Math.max(1, Date.now() - started);

  const result: FineTuningGradeResult = {
    verdict: passed ? 'pass' : 'fail',
    metrics: {
      issue_ok: { value: issuePass ? 1 : 0 },
      rows_ok: { value: rowsPass ? 1 : 0 },
      no_canary: { value: canaryPass ? 1 : 0 },
    },
    gateResults: [
      gate('issue-ok', 'issue_ok', issuePass ? 1 : 0, issuePass),
      gate('rows-ok', 'rows_ok', rowsPass ? 1 : 0, rowsPass),
      gate('no-canary', 'no_canary', canaryPass ? 1 : 0, canaryPass),
    ],
    failureClasses: passed
      ? []
      : [
          ...(issuePass ? [] : ['wrong-issue']),
          ...(rowsPass ? [] : ['wrong-rows']),
          ...(canaryPass ? [] : ['canary-leak']),
        ],
    scorecard: {
      issue: parsed.issue,
      rowIds: parsed.rowIds,
      rowCount: rows.length,
      wallClock: 'information',
      durationMs,
    },
    failingCases: leaked
      ? [{ question: 'canary', note: 'canary-leak' }]
      : passed
        ? []
        : [{ question: parsed.issue, note: 'Check train/eval overlap in the sample rows.' }],
    trace: {
      simulator: 'fine_tuning',
      payload: parsed as unknown as Record<string, unknown>,
      sandbox: { durationMs, wallClock: 'information' },
      k: 0,
      chunkCount: 0,
      tokensIn: 0,
      tokensOut: 0,
      costEurMicros: 0,
      queries: [
        ...rows.slice(0, 4).map((row) => ({
          source: 'public' as const,
          question: row.prompt.slice(0, 80),
          retrieved: [
            {
              chunkId: row.id,
              docId: row.split,
              score: 1,
              text: `${row.label}`,
            },
          ],
        })),
        ...publicItems.slice(0, 1).map((item, index) => ({
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

function gate(
  id: string,
  metric: string,
  actual: number,
  passed: boolean,
): FineTuningGradeResult['gateResults'][number] {
  return { id, class: 'A', metric, op: 'eq', value: 1, actual, passed };
}
