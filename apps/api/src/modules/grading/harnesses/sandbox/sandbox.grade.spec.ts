import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  SANDBOX_NEAR_MISS_PAYLOAD,
  SANDBOX_REFERENCE_PAYLOAD,
} from '../../../catalogue/exercises/exercises.constants';
import { SANDBOX_ERROR_CODES } from '../../../sandbox/sandbox.constants';
import { runLocalPython } from '../../../sandbox/local-python';
import type { CorpusDoc } from '../rag/chunking';
import type { HiddenItem } from '../rag/rag.types';
import { learnerInputJson, materialiseLearnerInput } from './sandbox.input';
import { gradeSandboxRetriever } from './sandbox.grade';

const contentRoot = path.join(
  process.cwd(),
  'content/exercises/rag-009-python-retriever',
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(path.join(contentRoot, name), 'utf8')) as T;
}

describe('sandbox retriever grader', () => {
  const docs = loadJson<CorpusDoc[]>('corpus.json');
  const hidden = loadJson<HiddenItem[]>('eval_hidden.json');
  const publicItems = loadJson<HiddenItem[]>('eval_public.json');

  it('strips gold answers and canaries from the sandbox workspace', () => {
    const input = materialiseLearnerInput(docs, hidden);
    const raw = learnerInputJson(docs, hidden);
    expect(raw).not.toContain('HIDDEN_EVAL');
    expect(raw).not.toContain('goldAnswer');
    expect(raw).not.toContain('goldSpan');
    expect(raw).not.toContain('goldDocId');
    expect(input.questions.some((item) => item.question.includes('PTO'))).toBe(
      true,
    );
  });

  it('passes the reference Python retriever', async () => {
    const result = await gradeSandboxRetriever(
      SANDBOX_REFERENCE_PAYLOAD,
      docs,
      hidden,
      publicItems,
      runLocalPython,
    );
    expect(result.verdict).toBe('pass');
    expect(result.metrics.recall_at_5.value).toBeGreaterThanOrEqual(0.8);
    expect(result.trace.sandbox.durationMs).toBeGreaterThan(0);
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
    expect(JSON.stringify(result.trace)).not.toContain('HIDDEN_EVAL');
  }, 30_000);

  it('fails the near-miss retriever', async () => {
    const result = await gradeSandboxRetriever(
      SANDBOX_NEAR_MISS_PAYLOAD,
      docs,
      hidden,
      publicItems,
      runLocalPython,
    );
    expect(result.verdict).toBe('fail');
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  }, 30_000);

  it('fails timeout and OOM attempts without leaking hidden data', async () => {
    const timeout = await gradeSandboxRetriever(
      { source: 'print(1)' },
      docs,
      hidden,
      publicItems,
      () =>
        Promise.resolve({
          ok: false,
          errorCode: SANDBOX_ERROR_CODES.TIMEOUT,
          exitCode: null,
          stdout: '',
          stderr: 'Execution exceeded 2s wall clock',
          durationMs: 2100,
          memoryPeakMb: 12,
          runtime: 'runc' as const,
        }),
    );
    expect(timeout.verdict).toBe('fail');
    expect(timeout.failureClasses).toEqual([SANDBOX_ERROR_CODES.TIMEOUT]);
    expect(timeout.trace.sandbox.durationMs).toBe(2100);
    expect(timeout.trace.sandbox.memoryPeakMb).toBe(12);
    expect(JSON.stringify(timeout)).not.toContain('HIDDEN_EVAL');

    const oom = await gradeSandboxRetriever(
      { source: 'print(1)' },
      docs,
      hidden,
      publicItems,
      () =>
        Promise.resolve({
          ok: false,
          errorCode: SANDBOX_ERROR_CODES.OOM,
          exitCode: 137,
          stdout: '',
          stderr: 'killed',
          durationMs: 400,
          memoryPeakMb: 512,
          runtime: 'runc' as const,
        }),
    );
    expect(oom.verdict).toBe('fail');
    expect(oom.failureClasses).toEqual([SANDBOX_ERROR_CODES.OOM]);
    expect(JSON.stringify(oom)).not.toContain('HIDDEN_EVAL');
  });

  describe('holdout questions cannot be smuggled out', () => {
    const holdout = hidden.filter(
      (item) =>
        item.split === 'holdout' && !item.question.includes('HIDDEN_EVAL'),
    );
    const blob = holdout.map((item) => item.question).join(' | ');
    const ok = (stdout: string) => ({
      ok: true,
      errorCode: SANDBOX_ERROR_CODES.OK,
      exitCode: 0,
      stdout,
      stderr: '',
      durationMs: 1,
      memoryPeakMb: 1,
      runtime: 'runc' as const,
    });

    it('never echoes passages that are not corpus spans', async () => {
      // Every question "retrieves" the holdout questions as its passage.
      const stdout = JSON.stringify({
        results: hidden.map((item) => ({ id: item.id, passages: [blob] })),
      });
      const result = await gradeSandboxRetriever(
        SANDBOX_REFERENCE_PAYLOAD,
        docs,
        hidden,
        publicItems,
        () => Promise.resolve(ok(stdout)),
      );
      const shown =
        JSON.stringify(result.failingCases) + JSON.stringify(result.trace);
      expect(result.verdict).toBe('fail');
      for (const item of holdout) {
        expect(shown).not.toContain(item.question);
      }
    });

    it('never shows stderr from the hidden run', async () => {
      const calls: string[] = [];
      const result = await gradeSandboxRetriever(
        SANDBOX_REFERENCE_PAYLOAD,
        docs,
        hidden,
        publicItems,
        (input) => {
          const questions = (
            JSON.parse(input.workspaceFiles?.['input.json'] ?? '{}') as {
              questions: { question: string }[];
            }
          ).questions;
          calls.push(
            questions.length > publicItems.length ? 'hidden' : 'public',
          );
          // Crash with the questions it was given in the error message.
          return Promise.resolve({
            ...ok(''),
            ok: questions.length <= publicItems.length,
            errorCode:
              questions.length <= publicItems.length
                ? SANDBOX_ERROR_CODES.OK
                : SANDBOX_ERROR_CODES.RUNTIME_ERROR,
            stderr: `Traceback: ${questions.map((q) => q.question).join(' | ')}`,
          });
        },
      );
      expect(calls).toEqual(['hidden', 'public']);
      const shown = JSON.stringify(result);
      for (const item of holdout) {
        expect(shown).not.toContain(item.question);
      }
      expect(result.failingCases[0]?.note).toMatch(
        /runs on the public samples/,
      );
    });
  });
});
