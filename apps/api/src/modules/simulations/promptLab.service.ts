import { z } from 'zod';
import { Types } from 'mongoose';
import { getAiClient } from '../ai-guidance/ai.client';
import { AI_CONFIG } from '../ai-guidance/ai.config';
import { SimulationSubmission } from './simulationSubmission.model';
import {
  PROMPT_LAB_PASS_SCORE,
  PROMPT_LAB_RUBRIC_CRITERIA,
  PROMPT_LAB_STARTER_PROMPTS,
} from './promptLab.rubric';
import type {
  PromptLabBootstrap,
  PromptLabRunResult,
  PromptLabStructuralAnalysis,
  PromptLabSubmitResult,
  RubricBreakdownItem,
} from './simulation.types';

const PROMPT_LAB_RUN_MAX_TOKENS = 600;

const GradeSchema = z
  .object({
    score: z.union([z.number(), z.string()]).optional(),
    passed: z.boolean().optional(),
    feedback: z.string().optional(),
    rubricBreakdown: z
      .array(
        z.object({
          criterion: z.string(),
          score: z.union([z.number(), z.string()]),
          maxScore: z.union([z.number(), z.string()]),
          note: z.string().optional(),
        }),
      )
      .optional(),
  })
  .transform((data) => {
    const rawScore = data.score;
    const score =
      typeof rawScore === 'number'
        ? rawScore
        : typeof rawScore === 'string'
          ? Number.parseFloat(rawScore)
          : Number.NaN;
    const rubricBreakdown: RubricBreakdownItem[] = (data.rubricBreakdown ?? []).map((item) => ({
      criterion: item.criterion,
      score: Number(item.score),
      maxScore: Number(item.maxScore),
      note: item.note ?? '',
    }));
    return {
      score,
      passed: data.passed ?? score >= PROMPT_LAB_PASS_SCORE,
      feedback: (data.feedback ?? 'Graded.').trim(),
      rubricBreakdown,
    };
  })
  .pipe(
    z.object({
      score: z.number().min(0).max(100),
      passed: z.boolean(),
      feedback: z.string().min(1),
      rubricBreakdown: z.array(
        z.object({
          criterion: z.string(),
          score: z.number(),
          maxScore: z.number(),
          note: z.string(),
        }),
      ),
    }),
  );

function stripMarkdownFence(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

export function analyzePromptLabOutput(output: string): PromptLabStructuralAnalysis {
  const trimmed = output.trim();
  const markdownFree = !/^```/m.test(trimmed);
  const candidate = stripMarkdownFence(trimmed);

  let parsed: Record<string, unknown> | null = null;
  let validJson = false;
  try {
    const value = JSON.parse(candidate);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      parsed = value as Record<string, unknown>;
      validJson = true;
    }
  } catch {
    validJson = false;
  }

  const hasTitleKey = Boolean(parsed && typeof parsed.title === 'string' && parsed.title.trim());
  const hasSummaryKey = Boolean(parsed && typeof parsed.summary === 'string' && parsed.summary.trim());

  let structuralScore = 0;
  if (validJson) structuralScore += 25;
  if (hasTitleKey && hasSummaryKey) structuralScore += 25;
  if (markdownFree && validJson) structuralScore += 10;
  if (hasSummaryKey && parsed?.summary && String(parsed.summary).length >= 20) structuralScore += 10;

  return {
    validJson,
    hasTitleKey,
    hasSummaryKey,
    markdownFree,
    structuralScore: Math.min(70, structuralScore),
  };
}

function buildStructuralHints(prompt: string, structural: PromptLabStructuralAnalysis): string[] {
  const hints: string[] = [];
  const p = prompt.toLowerCase();

  if (!structural.validJson) hints.push('Model output is not valid JSON — constrain format in your prompt.');
  if (!structural.hasTitleKey || !structural.hasSummaryKey) {
    hints.push('Require exact keys "title" and "summary" in the JSON object.');
  }
  if (!structural.markdownFree) hints.push('Tell the model: no markdown code fences.');
  if (!/\bjson\b/.test(p)) hints.push('Explicitly ask for JSON-only output.');
  if (!/\b(only|must|exactly|no markdown)\b/.test(p)) {
    hints.push('Add hard constraints like "JSON only" and "no markdown".');
  }

  return hints.slice(0, 4);
}

function buildFallbackRubric(output: string, sampleInput: string): RubricBreakdownItem[] {
  const structural = analyzePromptLabOutput(output);
  let summary = '';
  if (structural.validJson) {
    try {
      const parsed = JSON.parse(stripMarkdownFence(output.trim())) as { summary?: string };
      summary = typeof parsed.summary === 'string' ? parsed.summary : '';
    } catch {
      summary = '';
    }
  }

  const groundingScore =
    summary && sampleInput.toLowerCase().includes('earbuds') && /earbud|sound|battery|case/i.test(summary)
      ? 40
      : summary
        ? 20
        : 0;

  return [
    {
      criterion: 'Valid JSON only',
      score: structural.validJson ? 25 : 0,
      maxScore: 25,
      note: structural.validJson ? 'Parsed as JSON.' : 'Output was not valid JSON.',
    },
    {
      criterion: 'Required keys',
      score: structural.hasTitleKey && structural.hasSummaryKey ? 25 : 0,
      maxScore: 25,
      note:
        structural.hasTitleKey && structural.hasSummaryKey
          ? 'Found title and summary keys.'
          : 'Missing title and/or summary keys.',
    },
    {
      criterion: 'Grounded summary',
      score: groundingScore,
      maxScore: 50,
      note:
        groundingScore >= 40
          ? 'Summary reflects details from the review.'
          : 'Summary is missing or not grounded in the input.',
    },
  ];
}

function scoreFromRubric(breakdown: RubricBreakdownItem[]): number {
  return Math.max(0, Math.min(100, breakdown.reduce((sum, item) => sum + item.score, 0)));
}

export function getPromptLabBootstrap(): PromptLabBootstrap {
  return {
    starterPrompts: PROMPT_LAB_STARTER_PROMPTS.map((item) => ({ ...item })),
    rubricCriteria: PROMPT_LAB_RUBRIC_CRITERIA.map((item) => ({ ...item })),
    defaultPrompt: PROMPT_LAB_STARTER_PROMPTS[0].prompt,
  };
}

export async function runPromptLabLive(
  prompt: string,
  sampleInput: string,
  userId?: string | null,
): Promise<PromptLabRunResult> {
  const ai = getAiClient();
  const composed = `${prompt.trim()}\n\n---\nTask input:\n${sampleInput.trim()}`;

  const result = await ai.complete({
    system:
      'You are a task assistant in a prompt engineering lab. Follow the user instructions exactly. ' +
      'Return only what the user asked for — no preamble unless requested.',
    prompt: composed,
    model: AI_CONFIG.defaultModel,
    maxTokens: PROMPT_LAB_RUN_MAX_TOKENS,
    useCase: 'simulation_prompt_lab_run',
    userId,
  });

  const structural = analyzePromptLabOutput(result.text);

  return {
    output: result.text,
    model: result.model,
    usage: result.usage,
    structural,
    qualityScore: structural.structuralScore,
    hints: buildStructuralHints(prompt, structural),
  };
}

export async function submitPromptLabLive(input: {
  simulationSlug: string;
  prompt: string;
  sampleInput: string;
  taskPrompt: string;
  modelOutput?: string;
  userId?: string | null;
  guestSessionId?: string | null;
}): Promise<PromptLabSubmitResult> {
  const modelOutput =
    input.modelOutput?.trim() ||
    (await runPromptLabLive(input.prompt, input.sampleInput, input.userId)).output;

  const structural = analyzePromptLabOutput(modelOutput);
  const fallbackRubric = buildFallbackRubric(modelOutput, input.sampleInput);
  let score = scoreFromRubric(fallbackRubric);
  let passed = score >= PROMPT_LAB_PASS_SCORE;
  let feedback =
    passed
      ? 'Strong result. Output matches the JSON contract and stays grounded in the review.'
      : 'Output misses the JSON contract or summary quality bar. Tighten format constraints in your prompt.';
  let rubricBreakdown = fallbackRubric;

  try {
    const ai = getAiClient();
    const judged = await ai.completeStructured(
      {
        system:
          'You grade prompt-engineering lab submissions. Score the MODEL OUTPUT (not the prompt text) against the task and rubric. ' +
          'Be strict about JSON-only formatting and grounded summaries.',
        prompt: [
          `Task: ${input.taskPrompt}`,
          `Review input: ${input.sampleInput}`,
          `User prompt: ${input.prompt}`,
          `Model output:\n${modelOutput}`,
          `Rubric: ${JSON.stringify(PROMPT_LAB_RUBRIC_CRITERIA)}`,
          `Structural analysis: ${JSON.stringify(structural)}`,
          'Return score 0-100, pass if >= 70, rubricBreakdown with criterion scores.',
        ].join('\n\n'),
        model: AI_CONFIG.defaultModel,
        maxTokens: 900,
        useCase: 'simulation_prompt_lab_grade',
        userId: input.userId,
      },
      GradeSchema,
    );

    if (judged.data.rubricBreakdown.length > 0) {
      rubricBreakdown = judged.data.rubricBreakdown;
      score = scoreFromRubric(rubricBreakdown);
    } else {
      score = judged.data.score;
    }
    passed = score >= PROMPT_LAB_PASS_SCORE;
    feedback = judged.data.feedback;
  } catch {
    // Structural fallback already computed above.
  }

  const submission = await SimulationSubmission.create({
    simulationSlug: input.simulationSlug,
    kind: 'prompt_lab',
    userId: input.userId ? new Types.ObjectId(input.userId) : null,
    guestSessionId: input.guestSessionId?.trim() || null,
    prompt: input.prompt,
    modelOutput,
    modelId: AI_CONFIG.defaultModel,
    score,
    passed,
    feedback,
    rubricBreakdown,
    status: 'graded',
    gradedAt: new Date(),
  });

  return {
    passed,
    score,
    feedback,
    output: modelOutput,
    submissionId: String(submission._id),
    rubricBreakdown,
    structural,
  };
}
