import { describe, it, expect } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';
import { extractJson, wrapError } from '../src/modules/ai-guidance/provider';
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

  it('marks connection/timeout errors retryable (the timeout path)', () => {
    expect(retryable(new Anthropic.APIConnectionError({ message: 'timed out' }))).toBe(true);
  });

  it('marks rate-limit (429) retryable', () => {
    const err = new Anthropic.RateLimitError(429, { type: 'error', error: {} }, 'rate', undefined);
    expect(retryable(err)).toBe(true);
  });

  it('marks 5xx server errors retryable', () => {
    expect(retryable(new Anthropic.APIError(503, undefined, 'overloaded', undefined))).toBe(true);
  });

  it('marks 4xx client errors non-retryable', () => {
    expect(retryable(new Anthropic.APIError(400, undefined, 'bad request', undefined))).toBe(false);
  });

  it('marks unknown (non-API) errors non-retryable', () => {
    expect(retryable(new Error('boom'))).toBe(false);
  });

  it('passes an existing AiError through unchanged', () => {
    const original = new AiError('already wrapped', true);
    expect(wrapError(original)).toBe(original);
  });

  it('always returns an AiError instance', () => {
    expect(wrapError(new Error('boom'))).toBeInstanceOf(AiError);
  });
});
