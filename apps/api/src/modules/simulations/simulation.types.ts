import type { SIMULATION_KINDS } from './simulation.model';

export type SimulationKind = (typeof SIMULATION_KINDS)[number];

export interface SimulationPublic {
  slug: string;
  title: string;
  topic: string;
  difficulty: string;
  kind: SimulationKind;
  description: string;
  taskPrompt: string;
  sampleInput: string;
  order: number;
}

export interface PromptLabRunResult {
  output: string;
  qualityScore: number;
  hints: string[];
  model?: string;
  usage?: { inputTokens: number; outputTokens: number };
  structural?: PromptLabStructuralAnalysis;
}

export interface PromptLabStructuralAnalysis {
  validJson: boolean;
  hasTitleKey: boolean;
  hasSummaryKey: boolean;
  markdownFree: boolean;
  structuralScore: number;
}

export interface RubricBreakdownItem {
  criterion: string;
  score: number;
  maxScore: number;
  note: string;
}

export interface PromptLabSubmitResult extends SimulationSubmitResult {
  submissionId: string;
  rubricBreakdown: RubricBreakdownItem[];
  structural: PromptLabStructuralAnalysis;
}

export interface PromptLabBootstrap {
  starterPrompts: Array<{ id: string; label: string; prompt: string }>;
  rubricCriteria: Array<{ id: string; label: string; maxScore: number }>;
  defaultPrompt: string;
}

export interface VectorPlaygroundMatch {
  id: string;
  source: string;
  text: string;
  score: number;
  cosine: number;
  lexicalScore: number;
  lexicalTerms: string[];
  rank: number;
  retrieved: boolean;
}

export interface VectorPlaygroundRunResult {
  matches: VectorPlaygroundMatch[];
  index: VectorPlaygroundMatch[];
  hints: string[];
  defaultQuery?: string;
  embeddingModel?: string;
  embeddingProvider?: 'openrouter' | 'local';
  embeddingDimensions?: number;
  embeddingFallback?: boolean;
  embeddingWarning?: string;
  latencyMs?: number;
  topK?: number;
  topMatchId?: string;
}

export interface VectorPlaygroundSubmitResult extends SimulationSubmitResult {
  submissionId: string;
  topMatchId: string;
  selectedChunkId: string;
  selectedCosine: number;
  topCosine: number;
  selectedRank: number;
}

export type RagChunkSize = 'small' | 'medium' | 'large';

export interface RagPipelineChunkResult {
  id: string;
  text: string;
  sectionIds: string[];
  gold: boolean;
  conflict: boolean;
  score: number;
  cosine: number;
  lexicalScore: number;
  lexicalTerms: string[];
  rank: number;
  retrieved: boolean;
  cosineRank: number;
  rerankScore: number;
}

export interface RagPipelineRunResult {
  config: { chunkSize: RagChunkSize; topK: number; rerank: boolean };
  query: string;
  chunks: RagPipelineChunkResult[];
  retrievedContext: string;
  answer: string;
  grounded: boolean;
  goldInContext: boolean;
  contextConflict: boolean;
  goldRank: number | null;
  goldCosine: number | null;
  evidencePrecision: number;
  hints: string[];
  defaultQuery?: string;
  embeddingModel?: string;
  embeddingProvider?: 'openrouter' | 'local';
  embeddingDimensions?: number;
  embeddingFallback?: boolean;
  embeddingWarning?: string;
  latencyMs?: number;
}

export interface RagPipelineSubmitResult extends SimulationSubmitResult {
  submissionId: string;
  grounded: boolean;
  goldInContext: boolean;
  goldRank: number | null;
  goldCosine: number | null;
  evidencePrecision: number;
}

export type SimulationRunResult =
  | PromptLabRunResult
  | VectorPlaygroundRunResult
  | RagPipelineRunResult
  | GuardrailsRunResult;

export interface SimulationSubmitResult {
  passed: boolean;
  score: number;
  feedback: string;
  output: string;
}

export interface VectorChunkPublic {
  id: string;
  source: string;
  text: string;
}

export interface VectorPlaygroundBootstrap {
  chunks: VectorChunkPublic[];
  defaultQuery: string;
  topKRange: { min: number; max: number; default: number };
  sampleQueries: string[];
}

export interface RagPipelineBootstrap {
  defaultQuery: string;
  sourcePreview: string;
  sections: Array<{ id: string; text: string }>;
  chunkSizeOptions: Array<{ value: RagChunkSize; label: string; chars: number }>;
  topKRange: { min: number; max: number; default: number };
  defaultConfig: { chunkSize: RagChunkSize; topK: number; rerank: boolean };
  sampleQueries: string[];
}

export interface GuardrailsConfig {
  inputFilter: boolean;
  safetySystemPrompt: boolean;
  outputValidation: boolean;
}

export interface GuardrailsRunResult {
  config: GuardrailsConfig;
  userInput: string;
  inputKind: 'safe' | 'jailbreak' | 'harmful';
  status: 'allowed' | 'blocked_input' | 'refused' | 'blocked_output' | 'unsafe_output';
  layer: 'none' | 'input_filter' | 'system_prompt' | 'output_validation';
  mockOutput: string;
  safe: boolean;
  hints: string[];
}

export interface GuardrailsBootstrap {
  defaultUserInput: string;
  defaultConfig: GuardrailsConfig;
  guardrailOptions: Array<{
    key: keyof GuardrailsConfig;
    label: string;
    description: string;
  }>;
  testCases: Array<{ id: string; label: string; input: string }>;
}

export type SimulationBootstrap =
  | VectorPlaygroundBootstrap
  | RagPipelineBootstrap
  | GuardrailsBootstrap
  | PromptLabBootstrap
  | null;
