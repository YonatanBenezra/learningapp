export type RagFlowStepId =
  | "query"
  | "plan"
  | "retrieve"
  | "stores"
  | "evaluate"
  | "context"
  | "generate"
  | "grade";

export type RagExerciseMode =
  | "chunk"
  | "budget"
  | "prompt"
  | "rerank"
  | "sandbox";

export function ragModeFromSchema(schema: unknown): RagExerciseMode {
  const properties = (schema as { properties?: Record<string, unknown> })?.properties ?? {};
  const keys = Object.keys(properties);
  if (keys.length === 1 && keys[0] === "source") {
    return "sandbox";
  }
  if (keys.includes("generationPrompt")) {
    return "prompt";
  }
  if (keys.includes("reranker") || keys.includes("queryRewritePrompt")) {
    return "rerank";
  }
  if (keys.includes("topK") && !keys.includes("chunkSize")) {
    return "budget";
  }
  return "chunk";
}

export function activeRagFlowStep(
  mode: RagExerciseMode,
  phase: "idle" | "running" | "graded",
): RagFlowStepId {
  if (phase === "running") {
    return "grade";
  }
  if (phase === "graded") {
    return "grade";
  }
  switch (mode) {
    case "chunk":
      return "retrieve";
    case "budget":
    case "rerank":
      return "retrieve";
    case "prompt":
      return "generate";
    case "sandbox":
      return "retrieve";
    default:
      return "retrieve";
  }
}

export const RAG_FLOW_STEPS: {
  id: RagFlowStepId;
  label: string;
  short: string;
}[] = [
  { id: "query", label: "User query", short: "Query" },
  { id: "plan", label: "Planning agent", short: "Plan" },
  { id: "retrieve", label: "Retrieval agent", short: "Retrieve" },
  { id: "stores", label: "Vector + metadata", short: "Stores" },
  { id: "evaluate", label: "Evaluation agent", short: "Eval" },
  { id: "context", label: "Context assembly", short: "Context" },
  { id: "generate", label: "LLM generate", short: "Generate" },
  { id: "grade", label: "Grade", short: "Grade" },
];

export function stepCaption(mode: RagExerciseMode, active: RagFlowStepId): string {
  if (active === "grade") {
    return "Hidden eval set runs through the harness when you submit.";
  }
  if (active === "generate") {
    return "Author the generation prompt — retrieval config is fixed.";
  }
  if (active === "retrieve") {
    if (mode === "sandbox") {
      return "Your Python retriever runs against the hidden questions.";
    }
    return "Tune chunking and retrieval knobs before submit.";
  }
  return "Agentic RAG pipeline — preview of what your submission exercises.";
}
