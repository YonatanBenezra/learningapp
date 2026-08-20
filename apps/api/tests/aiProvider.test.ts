import { describe, it, expect } from 'vitest';
import { extractJson, wrapError, ProviderHttpError } from '../src/modules/ai-guidance/provider';
import { AiError } from '../src/modules/ai-guidance/ai.error';

describe('extractJson', () => {
  it('parses a plain JSON object', () => {
    expect(extractJson('{"a":1,"b":[2,3]}')).toEqual({ a: 1, b: [2, 3] });
  });

  it('parses JSON wrapped in a ```json fence', () => {
    expect(extractJson('```json\n{"ok":true}\n```')).toEqual({ ok: true });
  });

  it('parses a fenced block without a language tag', () => {
    expect(extractJson('```\n{"ok":true}\n```')).toEqual({ ok: true });
  });

  it('extracts JSON embedded in surrounding prose', () => {
    expect(extractJson('Sure! Here is the result: {"x":42} — hope it helps')).toEqual({ x: 42 });
  });

  it('parses a JSON array', () => {
    expect(extractJson('[1,2,3]')).toEqual([1, 2, 3]);
  });

  it('throws a typed AiError on non-JSON output', () => {
    expect(() => extractJson('I cannot do that.')).toThrow(AiError);
  });
});

describe('wrapError classification', () => {
  const retryable = (err: unknown): boolean => wrapError(err).retryable;

  it('marks timeout/abort errors retryable', () => {
    expect(retryable(Object.assign(new Error('timed out'), { name: 'AbortError' }))).toBe(true);
  });

  it('marks rate-limit (429) retryable', () => {
    expect(retryable(new ProviderHttpError('rate limited', 429))).toBe(true);
  });

  it('marks 5xx server errors retryable', () => {
    expect(retryable(new ProviderHttpError('overloaded', 503))).toBe(true);
  });

  it('marks 4xx client errors non-retryable', () => {
    expect(retryable(new ProviderHttpError('bad request', 400))).toBe(false);
  });

  it('marks unknown (non-API) errors non-retryable', () => {
    expect(retryable(new Error('boom'))).toBe(false);
  });

  it('marks fetch network failures retryable', () => {
    expect(retryable(new Error('fetch failed'))).toBe(true);
  });

  it('passes an existing AiError through unchanged', () => {
    const original = new AiError('already wrapped', true);
    expect(wrapError(original)).toBe(original);
  });

  it('always returns an AiError instance', () => {
    expect(wrapError(new Error('boom'))).toBeInstanceOf(AiError);
  });
});
