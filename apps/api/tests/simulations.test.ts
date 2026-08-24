import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../src/app';
import { getAiClient } from '../src/modules/ai-guidance/ai.client';
import { embedTexts } from '../src/modules/ai-guidance/embedding.client';
import { Simulation } from '../src/modules/simulations/simulation.model';
import { SimulationSubmission } from '../src/modules/simulations/simulationSubmission.model';
import { analyzePromptLabOutput } from '../src/modules/simulations/promptLab.service';
import { resetVectorPlaygroundCache } from '../src/modules/simulations/vectorPlayground.service';
import { resetRagPipelineCache } from '../src/modules/simulations/ragPipeline.service';
import { seedSimulations } from '../src/modules/simulations/simulation.service';

const TEST_DB = 'mongodb://127.0.0.1:27017/b2c_test_simulations';

const GOOD_JSON = JSON.stringify({
  title: 'Solid budget earbuds',
  summary: 'Clear sound and good battery life; the case feels cheap but overall great value for commuters.',
});

vi.mock('../src/modules/ai-guidance/ai.client', () => ({
  getAiClient: vi.fn(),
}));

vi.mock('../src/modules/ai-guidance/embedding.client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/modules/ai-guidance/embedding.client')>();
  return {
    ...actual,
    embedTexts: vi.fn(async (texts: string[]) => ({
      ...actual.localEmbedTexts(texts),
      fallbackReason: 'no_api_key' as const,
    })),
  };
});

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
});

beforeEach(() => {
  resetVectorPlaygroundCache();
  resetRagPipelineCache();
  vi.mocked(getAiClient).mockReturnValue({
    complete: vi.fn().mockResolvedValue({
      text: GOOD_JSON,
      model: 'anthropic/claude-sonnet-4',
      usage: { inputTokens: 120, outputTokens: 48 },
      costUsd: 0.001,
      stopReason: 'end_turn',
    }),
    completeStructured: vi.fn().mockResolvedValue({
      data: {
        score: 88,
        passed: true,
        feedback: 'Valid JSON with grounded summary.',
        rubricBreakdown: [
          { criterion: 'Valid JSON only', score: 25, maxScore: 25, note: 'Parsed cleanly.' },
          { criterion: 'Required keys', score: 25, maxScore: 25, note: 'title and summary present.' },
          { criterion: 'Grounded summary', score: 38, maxScore: 50, note: 'Grounded in review.' },
        ],
      },
      model: 'anthropic/claude-sonnet-4',
      usage: { inputTokens: 200, outputTokens: 90 },
      costUsd: 0.002,
      stopReason: 'end_turn',
    }),
  } as ReturnType<typeof getAiClient>);
});

afterEach(async () => {
  await Simulation.deleteMany({});
  await SimulationSubmission.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('simulations API', () => {
  it('lists seeded prompt lab simulation', async () => {
    await seedSimulations();
    const res = await request(app).get('/simulations');
    expect(res.status).toBe(200);
    expect(res.body.simulations).toHaveLength(4);
    expect(res.body.simulations.map((s: { slug: string }) => s.slug)).toEqual([
      'prompt-lab',
      'vector-playground',
      'rag-pipeline',
      'guardrails',
    ]);
  });

  it('analyzes prompt lab output structurally', () => {
    const good = analyzePromptLabOutput(GOOD_JSON);
    expect(good.validJson).toBe(true);
    expect(good.hasTitleKey).toBe(true);
    expect(good.hasSummaryKey).toBe(true);

    const bad = analyzePromptLabOutput('Here is a friendly paragraph about earbuds.');
    expect(bad.validJson).toBe(false);
    expect(bad.structuralScore).toBeLessThan(40);
  });

  it('runs and submits prompt lab with live pipeline and persistence', async () => {
    await seedSimulations();

    const detail = await request(app).get('/simulations/prompt-lab');
    expect(detail.status).toBe(200);
    expect(detail.body.bootstrap.starterPrompts.length).toBeGreaterThan(0);

    const weakPrompt = 'Summarize this review nicely.';
    vi.mocked(getAiClient).mockReturnValueOnce({
      complete: vi.fn().mockResolvedValue({
        text: 'These earbuds are nice and affordable.',
        model: 'anthropic/claude-sonnet-4',
        usage: { inputTokens: 80, outputTokens: 20 },
        costUsd: 0.001,
        stopReason: 'end_turn',
      }),
      completeStructured: vi.fn(),
    } as ReturnType<typeof getAiClient>);

    const weak = await request(app).post('/simulations/prompt-lab/run').send({ prompt: weakPrompt });
    expect(weak.status).toBe(200);
    expect(weak.body.result.model).toBeTruthy();
    expect(weak.body.result.structural.validJson).toBe(false);

    const strongPrompt =
      'Return JSON only with keys title and summary. No markdown. Summarize the review.';

    const run = await request(app).post('/simulations/prompt-lab/run').send({ prompt: strongPrompt });
    expect(run.status).toBe(200);
    expect(run.body.result.output).toContain('"title"');
    expect(run.body.result.structural.validJson).toBe(true);

    const submit = await request(app)
      .post('/simulations/prompt-lab/submit')
      .send({ prompt: strongPrompt, modelOutput: run.body.result.output });
    expect(submit.status).toBe(201);
    expect(submit.body.result.passed).toBe(true);
    expect(submit.body.result.submissionId).toBeTruthy();
    expect(submit.body.result.rubricBreakdown.length).toBeGreaterThan(0);

    const saved = await SimulationSubmission.findOne({ simulationSlug: 'prompt-lab' }).lean();
    expect(saved?.passed).toBe(true);
    expect(saved?.modelOutput).toContain('"title"');
  });

  it('returns vector playground bootstrap and ranks chunks', async () => {
    await seedSimulations();

    const detail = await request(app).get('/simulations/vector-playground');
    expect(detail.status).toBe(200);
    expect(detail.body.simulation.kind).toBe('vector_playground');
    expect(detail.body.bootstrap.chunks.length).toBeGreaterThanOrEqual(3);
    expect(detail.body.bootstrap.topKRange.default).toBe(3);
    expect(detail.body.bootstrap.sampleQueries.length).toBeGreaterThanOrEqual(2);

    const run = await request(app)
      .post('/simulations/vector-playground/run')
      .send({ query: 'How can I reduce hallucinations when building a RAG assistant?' });
    expect(run.status).toBe(200);
    expect(run.body.result.matches[0].id).toBe('chunk-hallucination');
    expect(run.body.result.matches[0].score).toBeGreaterThan(50);
    expect(run.body.result.matches[0].cosine).toBeGreaterThan(0.5);
    expect(run.body.result.matches.length).toBe(3);
    expect(run.body.result.index).toHaveLength(5);
    expect(run.body.result.index.filter((row: { retrieved: boolean }) => row.retrieved)).toHaveLength(3);
    expect(typeof run.body.result.matches[0].lexicalScore).toBe('number');
    expect(Array.isArray(run.body.result.matches[0].lexicalTerms)).toBe(true);
    expect(run.body.result.embeddingModel).toBeTruthy();
    expect(run.body.result.embeddingProvider).toBe('local');
    expect(run.body.result.embeddingDimensions).toBe(64);
    expect(run.body.result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(run.body.result.embeddingWarning).toBeTruthy();

    const pass = await request(app)
      .post('/simulations/vector-playground/submit')
      .send({
        query: 'How can I reduce hallucinations when building a RAG assistant?',
        selectedChunkId: 'chunk-hallucination',
      });
    expect(pass.status).toBe(201);
    expect(pass.body.result.passed).toBe(true);
    expect(pass.body.result.submissionId).toBeTruthy();
    expect(pass.body.result.score).toBe(run.body.result.matches[0].score);
    expect(pass.body.result.selectedCosine).toBe(run.body.result.matches[0].cosine);
    expect(pass.body.result.topCosine).toBe(run.body.result.matches[0].cosine);
    expect(pass.body.result.selectedRank).toBe(1);

    const saved = await SimulationSubmission.findById(pass.body.result.submissionId).lean();
    expect(saved?.kind).toBe('vector_playground');
    expect(saved?.passed).toBe(true);

    const fail = await request(app)
      .post('/simulations/vector-playground/submit')
      .send({
        query: 'How can I reduce hallucinations when building a RAG assistant?',
        selectedChunkId: 'chunk-finetune',
      });
    const failRow = run.body.result.index.find((row: { id: string }) => row.id === 'chunk-finetune');
    expect(fail.status).toBe(201);
    expect(fail.body.result.passed).toBe(false);
    expect(fail.body.result.selectedChunkId).toBe('chunk-finetune');
    expect(fail.body.result.topMatchId).toBe('chunk-hallucination');
    expect(fail.body.result.score).toBe(failRow.score);
    expect(fail.body.result.selectedRank).toBe(failRow.rank);
    expect(fail.body.result.selectedRank).toBeGreaterThan(1);
  });

  it('runs rag pipeline with chunking controls and grades grounded answers', async () => {
    await seedSimulations();

    const detail = await request(app).get('/simulations/rag-pipeline');
    expect(detail.status).toBe(200);
    expect(detail.body.simulation.kind).toBe('rag_pipeline');
    expect(detail.body.bootstrap.defaultConfig.rerank).toBe(false);
    expect(detail.body.bootstrap.sections.length).toBe(5);

    const bad = await request(app)
      .post('/simulations/rag-pipeline/run')
      .send({ query: 'Can I get a refund on downloaded software?', chunkSize: 'medium', topK: 1, rerank: false });
    expect(bad.status).toBe(200);
    expect(bad.body.result.grounded).toBe(false);
    expect(bad.body.result.goldInContext).toBe(false);
    expect(bad.body.result.answer).toContain('30 days');
    expect(bad.body.result.query).toContain('downloaded software');

    const hardware = await request(app)
      .post('/simulations/rag-pipeline/run')
      .send({ query: 'What is the return window for hardware?', chunkSize: 'small', topK: 1, rerank: false });
    expect(hardware.status).toBe(200);
    expect(hardware.body.result.chunks[0].id).toBe('hardware');

    const good = await request(app)
      .post('/simulations/rag-pipeline/run')
      .send({ query: 'Can I get a refund on downloaded software?', chunkSize: 'medium', topK: 1, rerank: true });
    expect(good.status).toBe(200);
    expect(good.body.result.grounded).toBe(true);
    expect(good.body.result.goldInContext).toBe(true);
    expect(good.body.result.answer).toContain('non-refundable');
    expect(good.body.result.chunks[0].gold).toBe(true);

    const pass = await request(app)
      .post('/simulations/rag-pipeline/submit')
      .send({ query: 'Can I get a refund on downloaded software?', chunkSize: 'medium', topK: 1, rerank: true });
    expect(pass.status).toBe(201);
    expect(pass.body.result.passed).toBe(true);
    expect(pass.body.result.score).toBe(good.body.result.chunks.find((row: { gold: boolean }) => row.gold).score);
    expect(pass.body.result.submissionId).toBeTruthy();

    const fail = await request(app)
      .post('/simulations/rag-pipeline/submit')
      .send({ query: 'Can I get a refund on downloaded software?', chunkSize: 'large', topK: 1, rerank: true });
    expect(fail.status).toBe(201);
    expect(fail.body.result.passed).toBe(false);
    expect(fail.body.result.goldInContext).toBe(true);
    expect(fail.body.result.score).toBe(fail.body.result.evidencePrecision);
  });

  it('runs guardrails simulator and grades layered defenses', async () => {
    await seedSimulations();

    const detail = await request(app).get('/simulations/guardrails');
    expect(detail.status).toBe(200);
    expect(detail.body.simulation.kind).toBe('guardrails');
    expect(detail.body.bootstrap.defaultConfig.inputFilter).toBe(false);

    const leaked = await request(app).post('/simulations/guardrails/run').send({});
    expect(leaked.status).toBe(200);
    expect(leaked.body.result.safe).toBe(false);
    expect(leaked.body.result.mockOutput).toContain('Hidden system prompt');

    const blocked = await request(app)
      .post('/simulations/guardrails/run')
      .send({ inputFilter: true, safetySystemPrompt: true, outputValidation: true });
    expect(blocked.status).toBe(200);
    expect(blocked.body.result.safe).toBe(true);
    expect(blocked.body.result.status).toBe('blocked_input');

    const pass = await request(app)
      .post('/simulations/guardrails/submit')
      .send({ inputFilter: true, safetySystemPrompt: true, outputValidation: true });
    expect(pass.status).toBe(201);
    expect(pass.body.result.passed).toBe(true);

    const fail = await request(app).post('/simulations/guardrails/submit').send({ inputFilter: true });
    expect(fail.status).toBe(201);
    expect(fail.body.result.passed).toBe(false);
  });
});
