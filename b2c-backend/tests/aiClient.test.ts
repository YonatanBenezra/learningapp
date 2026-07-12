import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { AiClient } from '../src/modules/ai-guidance/ai.client';
import { AiError } from '../src/modules/ai-guidance/ai.error';
import { InMemoryUsageRecorder } from '../src/modules/ai-guidance/usageRecorder';
import { estimateCostUsd } from '../src/modules/ai-guidance/pricing';
import type {
  AiProvider,
  AiTextResult,
  AiStructuredResult,
} from '../src/modules/ai-guidance/types';

const schema = z.object({ title: z.string(), modules: z.array(z.string()) });
const fastOpts = { baseDelayMs: 0, sleep: async () => {} };

// Build a fake provider with per-test behavior. Cast away the generic on
// generateStructured — the interface is generic but tests supply concrete data.
function makeProvider(impl: {
  generateText?: AiProvider['generateText'];
  generateStructured?: () => Promise<AiStructuredResult<unknown>>;
}): AiProvider {
  return {
    generateText:
      impl.generateText ??
      (async () => {
        throw new Error('generateText not stubbed');
      }),
    generateStructured: (impl.generateStructured ??
      (async () => {
        throw new Error('generateStructured not stubbed');
      })) as AiProvider['generateStructured'],
  };
}

const textResult = (over: Partial<AiTextResult> = {}): AiTextResult => ({
  text: 'ok',
  model: 'claude-opus-4-8',
  usage: { inputTokens: 1, outputTokens: 1 },
  stopReason: 'end_turn',
  ...over,
});

describe('estimateCostUsd', () => {
  it('prices opus-4-8 at $5/$25 per 1M tokens', () => {
    expect(
      estimateCostUsd('claude-opus-4-8', { inputTokens: 1_000_000, outputTokens: 1_000_000 }),
    ).toBeCloseTo(30, 6);
  });

  it('falls back to opus pricing for unknown models', () => {
    expect(
      estimateCostUsd('mystery-model', { inputTokens: 1_000_000, outputTokens: 0 }),
    ).toBeCloseTo(5, 6);
  });
});

describe('AiClient.completeStructured', () => {
  it('returns a zod-validated object and records usage + cost', async () => {
    const recorder = new InMemoryUsageRecorder();
    const provider = makeProvider({
      generateStructured: async () => ({
        data: { title: 'Intro', modules: ['a', 'b'] },
        model: 'claude-opus-4-8',
        usage: { inputTokens: 100, outputTokens: 400 },
        stopReason: 'end_turn',
      }),
    });
    const client = new AiClient(provider, recorder, fastOpts);

    const res = await client.completeStructured({ prompt: 'x', useCase: 'course' }, schema);

    expect(res.data.title).toBe('Intro');
    expect(res.data.modules).toEqual(['a', 'b']);
    expect(res.costUsd).toBeCloseTo(
      estimateCostUsd('claude-opus-4-8', { inputTokens: 100, outputTokens: 400 }),
      8,
    );
    expect(recorder.entries).toHaveLength(1);
    expect(recorder.entries[0].useCase).toBe('course');
    expect(recorder.entries[0].costUsd).toBe(res.costUsd);
  });

  it('surfaces a typed AiError when the provider returns non-JSON / no output', async () => {
    const provider = makeProvider({
      generateStructured: async () => {
        throw new AiError('AI returned non-JSON output', false);
      },
    });
    const client = new AiClient(provider, new InMemoryUsageRecorder(), fastOpts);
    await expect(client.completeStructured({ prompt: 'x' }, schema)).rejects.toBeInstanceOf(AiError);
  });

  it('rejects with AiError when output fails schema re-validation', async () => {
    const provider = makeProvider({
      generateStructured: async () => ({
        data: { title: 123, modules: 'not-an-array' },
        model: 'claude-opus-4-8',
        usage: { inputTokens: 1, outputTokens: 1 },
        stopReason: 'end_turn',
      }),
    });
    const client = new AiClient(provider, new InMemoryUsageRecorder(), fastOpts);
    await expect(client.completeStructured({ prompt: 'x' }, schema)).rejects.toBeInstanceOf(AiError);
  });
});

describe('AiClient retry / backoff', () => {
  it('retries retryable errors then succeeds', async () => {
    let calls = 0;
    const provider = makeProvider({
      generateText: async () => {
        calls += 1;
        if (calls < 3) throw new AiError('overloaded', true);
        return textResult({ text: 'recovered' });
      },
    });
    const client = new AiClient(provider, new InMemoryUsageRecorder(), {
      maxRetries: 3,
      baseDelayMs: 0,
      sleep: async () => {},
    });

    const res = await client.complete({ prompt: 'x' });
    expect(res.text).toBe('recovered');
    expect(calls).toBe(3);
  });

  it('does not retry non-retryable errors', async () => {
    let calls = 0;
    const provider = makeProvider({
      generateText: async () => {
        calls += 1;
        throw new AiError('bad request', false);
      },
    });
    const client = new AiClient(provider, new InMemoryUsageRecorder(), fastOpts);
    await expect(client.complete({ prompt: 'x' })).rejects.toBeInstanceOf(AiError);
    expect(calls).toBe(1);
  });

  it('gives up after maxRetries on persistent retryable errors', async () => {
    let calls = 0;
    const provider = makeProvider({
      generateText: async () => {
        calls += 1;
        throw new AiError('overloaded', true);
      },
    });
    const client = new AiClient(provider, new InMemoryUsageRecorder(), {
      maxRetries: 2,
      baseDelayMs: 0,
      sleep: async () => {},
    });
    await expect(client.complete({ prompt: 'x' })).rejects.toBeInstanceOf(AiError);
    expect(calls).toBe(3); // initial + 2 retries
  });
});
