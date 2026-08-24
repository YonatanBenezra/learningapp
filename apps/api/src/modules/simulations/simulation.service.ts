import { AppError } from '../../common/errors/AppError';
import { logger } from '../../common/utils/logger';
import { Simulation } from './simulation.model';
import { getGuardrailsBootstrap, runGuardrails, submitGuardrails } from './guardrails.engine';
import { getPromptLabBootstrap, runPromptLabLive, submitPromptLabLive } from './promptLab.service';
import {
  getRagPipelineBootstrap,
  runRagPipelineLive,
  submitRagPipelineLive,
} from './ragPipeline.service';
import {
  getVectorPlaygroundBootstrap,
  runVectorPlaygroundLive,
  submitVectorPlaygroundLive,
} from './vectorPlayground.service';
import { SEED_SIMULATIONS } from './simulations.seed';
import type {
  SimulationBootstrap,
  SimulationPublic,
  SimulationRunResult,
  SimulationSubmitResult,
} from './simulation.types';

export interface SimulationRequestContext {
  userId?: string;
  guestSessionId?: string;
}

function toPublic(simulation: {
  slug: string;
  title: string;
  topic: string;
  difficulty: string;
  kind: string;
  description: string;
  taskPrompt: string;
  sampleInput: string;
  order: number;
}): SimulationPublic {
  return {
    slug: simulation.slug,
    title: simulation.title,
    topic: simulation.topic,
    difficulty: simulation.difficulty,
    kind: simulation.kind as SimulationPublic['kind'],
    description: simulation.description,
    taskPrompt: simulation.taskPrompt,
    sampleInput: simulation.sampleInput,
    order: simulation.order,
  };
}

export async function seedSimulations(): Promise<void> {
  for (const item of SEED_SIMULATIONS) {
    await Simulation.updateOne({ slug: item.slug }, { $set: { ...item, active: true } }, { upsert: true });
  }
  logger.info({ count: SEED_SIMULATIONS.length }, 'Simulation bank seeded');
}

export async function listSimulations(): Promise<{ simulations: SimulationPublic[] }> {
  const rows = await Simulation.find({ active: true }).sort({ order: 1 }).lean();
  return { simulations: rows.map(toPublic) };
}

export async function getSimulationBySlug(slug: string): Promise<SimulationPublic> {
  const simulation = await Simulation.findOne({ slug, active: true }).lean();
  if (!simulation) throw new AppError(404, 'Simulation not found');
  return toPublic(simulation);
}

export async function getSimulationBootstrap(slug: string): Promise<SimulationBootstrap> {
  const simulation = await getSimulationBySlug(slug);

  if (simulation.kind === 'prompt_lab') {
    return getPromptLabBootstrap();
  }

  if (simulation.kind === 'vector_playground') {
    return getVectorPlaygroundBootstrap();
  }

  if (simulation.kind === 'rag_pipeline') {
    return getRagPipelineBootstrap();
  }

  if (simulation.kind === 'guardrails') {
    return getGuardrailsBootstrap();
  }

  return null;
}

export async function runSimulation(
  slug: string,
  body: {
    prompt?: string;
    query?: string;
    topK?: number;
    chunkSize?: 'small' | 'medium' | 'large';
    rerank?: boolean;
    userInput?: string;
    inputFilter?: boolean;
    safetySystemPrompt?: boolean;
    outputValidation?: boolean;
  },
  ctx: SimulationRequestContext = {},
): Promise<SimulationRunResult> {
  const simulation = await getSimulationBySlug(slug);

  if (simulation.kind === 'prompt_lab') {
    if (!body.prompt?.trim()) throw new AppError(400, 'prompt is required');
    return runPromptLabLive(body.prompt, simulation.sampleInput, ctx.userId ?? null);
  }

  if (simulation.kind === 'vector_playground') {
    const query = (body.query ?? simulation.sampleInput).trim();
    if (!query) throw new AppError(400, 'query is required');
    return runVectorPlaygroundLive(query, body.topK ?? 3);
  }

  if (simulation.kind === 'rag_pipeline') {
    const query = (body.query ?? simulation.sampleInput).trim();
    if (!query) throw new AppError(400, 'query is required');
    const bootstrap = getRagPipelineBootstrap();
    return runRagPipelineLive(
      query,
      body.chunkSize ?? bootstrap.defaultConfig.chunkSize,
      body.topK ?? bootstrap.defaultConfig.topK,
      body.rerank ?? bootstrap.defaultConfig.rerank,
    );
  }

  if (simulation.kind === 'guardrails') {
    const userInput = (body.userInput ?? simulation.sampleInput).trim();
    if (!userInput) throw new AppError(400, 'userInput is required');
    return runGuardrails(userInput, resolveGuardrailsConfig(body));
  }

  throw new AppError(400, 'Run is not supported for this simulation yet');
}

function resolveGuardrailsConfig(body: {
  inputFilter?: boolean;
  safetySystemPrompt?: boolean;
  outputValidation?: boolean;
}) {
  const bootstrap = getGuardrailsBootstrap();
  return {
    inputFilter: body.inputFilter ?? bootstrap.defaultConfig.inputFilter,
    safetySystemPrompt: body.safetySystemPrompt ?? bootstrap.defaultConfig.safetySystemPrompt,
    outputValidation: body.outputValidation ?? bootstrap.defaultConfig.outputValidation,
  };
}

export async function submitSimulation(
  slug: string,
  body: {
    prompt?: string;
    query?: string;
    selectedChunkId?: string;
    chunkSize?: 'small' | 'medium' | 'large';
    topK?: number;
    rerank?: boolean;
    userInput?: string;
    inputFilter?: boolean;
    safetySystemPrompt?: boolean;
    outputValidation?: boolean;
    modelOutput?: string;
    guestSessionId?: string;
  },
  ctx: SimulationRequestContext = {},
): Promise<SimulationSubmitResult> {
  const simulation = await getSimulationBySlug(slug);
  const guestSessionId = body.guestSessionId ?? ctx.guestSessionId;

  if (simulation.kind === 'prompt_lab') {
    if (!body.prompt?.trim()) throw new AppError(400, 'prompt is required');
    return submitPromptLabLive({
      simulationSlug: simulation.slug,
      prompt: body.prompt,
      sampleInput: simulation.sampleInput,
      taskPrompt: simulation.taskPrompt,
      modelOutput: body.modelOutput,
      userId: ctx.userId ?? null,
      guestSessionId: guestSessionId ?? null,
    });
  }

  if (simulation.kind === 'vector_playground') {
    const query = (body.query ?? simulation.sampleInput).trim();
    if (!query) throw new AppError(400, 'query is required');
    if (!body.selectedChunkId?.trim()) throw new AppError(400, 'selectedChunkId is required');
    return submitVectorPlaygroundLive({
      simulationSlug: simulation.slug,
      query,
      selectedChunkId: body.selectedChunkId,
      topK: body.topK,
      userId: ctx.userId ?? null,
      guestSessionId: guestSessionId ?? null,
    });
  }

  if (simulation.kind === 'rag_pipeline') {
    const query = (body.query ?? simulation.sampleInput).trim();
    if (!query) throw new AppError(400, 'query is required');
    const bootstrap = getRagPipelineBootstrap();
    return submitRagPipelineLive({
      simulationSlug: simulation.slug,
      query,
      chunkSize: body.chunkSize ?? bootstrap.defaultConfig.chunkSize,
      topK: body.topK ?? bootstrap.defaultConfig.topK,
      rerank: body.rerank ?? bootstrap.defaultConfig.rerank,
      userId: ctx.userId ?? null,
      guestSessionId: guestSessionId ?? null,
    });
  }

  if (simulation.kind === 'guardrails') {
    const userInput = (body.userInput ?? simulation.sampleInput).trim();
    if (!userInput) throw new AppError(400, 'userInput is required');
    return submitGuardrails(userInput, resolveGuardrailsConfig(body));
  }

  throw new AppError(400, 'Submit is not supported for this simulation yet');
}
