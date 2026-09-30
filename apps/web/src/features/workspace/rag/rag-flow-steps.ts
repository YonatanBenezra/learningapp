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

export type RagFlowPhase = "idle" | "running" | "graded";

export function ragFlowPhaseFromFlags(
  pending?: boolean,
  graded?: boolean,
): RagFlowPhase {
  if (pending) {
    return "running";
  }
  if (graded) {
    return "graded";
  }
  return "idle";
}

export function ragFlowStepState(
  stepId: RagFlowStepId,
  active: RagFlowStepId,
  phase: RagFlowPhase,
): "active" | "done" | "dim" {
  const order = RAG_FLOW_STEPS.map((s) => s.id);
  const ai = order.indexOf(active);
  const si = order.indexOf(stepId);
  if (si === ai) {
    return phase === "graded" ? "done" : "active";
  }
  if (phase === "graded" && si < ai) {
    return "done";
  }
  if (si < ai) {
    return "done";
  }
  if (stepId === "plan" || stepId === "evaluate") {
    return "dim";
  }
  if (stepId === "generate" && active !== "generate" && active !== "grade") {
    return "dim";
  }
  return "dim";
}

/** Staged highlight while a submission is in flight. */
export const RAG_FLOW_RUN_PULSE_STEPS: RagFlowStepId[] = [
  "retrieve",
  "stores",
  "context",
  "grade",
];

export function activeRagFlowStep(
  mode: RagExerciseMode,
  phase: RagFlowPhase,
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
    if (mode === "budget") {
      return "Tune top-k and chunking — budget gate runs on assembled context.";
    }
    if (mode === "rerank") {
      return "Configure reranker and rewrite — vector + metadata paths both matter.";
    }
    return "Tune chunking and retrieval knobs before submit.";
  }
  return "Agentic RAG pipeline — preview of what your submission exercises.";
}
