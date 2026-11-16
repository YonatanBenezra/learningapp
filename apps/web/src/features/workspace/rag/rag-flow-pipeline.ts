import type { Edge, Node } from "@xyflow/react";
import type { Verdict } from "@/types/grade";
import {
  ragFlowIcon,
  ragFlowIconAccent,
  type RagFlowNodeData,
  type RagFlowNodeState,
} from "./rag-flow-node";

export const RAG_FLOW_NODE_TYPE = "ragFlow";

export type RagExerciseMode = "chunk" | "budget" | "prompt" | "rerank" | "sandbox";

export type RagFlowPhase = "idle" | "running" | "graded";

type IconKey = Parameters<typeof ragFlowIcon>[0];

/** One stage the grader really runs, in order. */
export type PipelineStage = {
  id: string;
  title: string;
  subtitle: string;
  icon: IconKey;
  /** The learner's config changes this stage. */
  control: boolean;
  /** What the grader does here, shown when the stage is focused. */
  detail: string;
};

/** Which grader archetype a submission schema belongs to. */
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
  if (keys.includes("topK")) {
    return "budget";
  }
  return "chunk";
}

export function ragFlowPhaseFromFlags(pending?: boolean, graded?: boolean): RagFlowPhase {
  if (pending) {
    return "running";
  }
  return graded ? "graded" : "idle";
}

const QUERY: PipelineStage = {
  id: "query",
  title: "Query",
  subtitle: "hidden set",
  icon: "query",
  control: false,
  detail: "Each hidden-set question runs through the same pipeline.",
};

/** Mirrors the graders in apps/api/src/modules/grading/harnesses. */
const PIPELINES: Record<RagExerciseMode, PipelineStage[]> = {
  chunk: [
    QUERY,
    {
      id: "chunker",
      title: "Chunker",
      subtitle: "you control",
      icon: "vdb",
      control: true,
      detail: "Your chunk size, overlap and split strategy cut every document into chunks.",
    },
    {
      id: "search",
      title: "BM25",
      subtitle: "top 5",
      icon: "vsearch",
      control: false,
      detail: "BM25 keyword search ranks the chunks and keeps the top 5.",
    },
    {
      id: "context",
      title: "Context",
      subtitle: "token budget",
      icon: "context",
      control: false,
      detail: "The top-5 chunks form the context; their size counts against the token budget.",
    },
    {
      id: "grade",
      title: "Grade",
      subtitle: "recall@5 · tokens",
      icon: "grade",
      control: false,
      detail: "Pass when the gold sentence is in the top 5 often enough, within the budget.",
    },
  ],
  budget: [
    QUERY,
    {
      id: "chunker",
      title: "Chunks",
      subtitle: "you set size",
      icon: "vdb",
      control: true,
      detail: "Documents are packed into whole-sentence chunks up to your chunk size.",
    },
    {
      id: "search",
      title: "BM25",
      subtitle: "you set top-k",
      icon: "vsearch",
      control: true,
      detail: "BM25 keyword search returns your top-k chunks (4× top-k candidates when rerank is on).",
    },
    {
      id: "rerank",
      title: "Rerank",
      subtitle: "optional",
      icon: "evaluator",
      control: true,
      detail: "When on, chunks whose document title matches the query move to the top.",
    },
    {
      id: "context",
      title: "Context",
      subtitle: "sent in full",
      icon: "context",
      control: false,
      detail: "Every retrieved chunk is sent in full; prompt tokens are counted on exactly this text.",
    },
    {
      id: "grade",
      title: "Grade",
      subtitle: "recall@k · tokens",
      icon: "grade",
      control: false,
      detail: "Pass when the gold sentence is in the context often enough, within the token budget.",
    },
  ],
  prompt: [
    QUERY,
    {
      id: "search",
      title: "Retrieval",
      subtitle: "fixed",
      icon: "vsearch",
      control: false,
      detail: "Retrieval is locked: BM25 plus title boost over whole documents, top 5.",
    },
    {
      id: "context",
      title: "Context",
      subtitle: "chunk ids",
      icon: "context",
      control: false,
      detail: "The top-5 chunks are passed to the generator with their chunk ids.",
    },
    {
      id: "llm",
      title: "Generator",
      subtitle: "your prompt",
      icon: "llm",
      control: true,
      detail: "Your generation prompt decides citation format and when to refuse.",
    },
    {
      id: "grade",
      title: "Grade",
      subtitle: "citations · refusals",
      icon: "grade",
      control: false,
      detail: "Checks citation format, gold-span overlap of cited chunks, and refusal behaviour.",
    },
  ],
  rerank: [
    QUERY,
    {
      id: "rewrite",
      title: "Rewrite",
      subtitle: "optional LLM call",
      icon: "llm",
      control: true,
      detail:
        "An optional query-rewrite prompt adds one model call per question. The rewritten query is not used for ranking yet.",
    },
    {
      id: "search",
      title: "First stage",
      subtitle: "keyword count",
      icon: "vsearch",
      control: false,
      detail: "A deliberately weak keyword count fills the candidate window.",
    },
    {
      id: "rerank",
      title: "Reranker",
      subtitle: "you choose",
      icon: "evaluator",
      control: true,
      detail: "Your reranker and window size reorder the candidates; the top 5 are kept.",
    },
    {
      id: "grade",
      title: "Grade",
      subtitle: "nDCG gain · tokens",
      icon: "grade",
      control: false,
      detail: "Pass when nDCG@5 improves enough over the first stage within token and call caps.",
    },
  ],
  sandbox: [
    QUERY,
    {
      id: "code",
      title: "Your code",
      subtitle: "Python",
      icon: "retriever",
      control: true,
      detail: "Your Python retriever returns passages for every question in a sandbox.",
    },
    {
      id: "grade",
      title: "Grade",
      subtitle: "recall@5",
      icon: "grade",
      control: false,
      detail: "Pass when the gold sentence is in your top 5 passages often enough.",
    },
  ],
};

const MODE_LABELS: Record<RagExerciseMode, string> = {
  chunk: "R1 · chunking",
  budget: "R2 · cost-capped retrieval",
  prompt: "R3 · grounded generation",
  rerank: "R4 · rerank",
  sandbox: "Custom retriever",
};

export function pipelineForMode(mode: RagExerciseMode): PipelineStage[] {
  return PIPELINES[mode];
}

export function ragFlowModeLabel(mode: RagExerciseMode): string {
  return MODE_LABELS[mode];
}

const LIT = "#2dd4bf";
const DIM = "rgba(148, 163, 184, 0.45)";
const STAGE_GAP = 128;

function stageState(
  stage: PipelineStage,
  phase: RagFlowPhase,
  verdict: Verdict | null,
): RagFlowNodeState {
  if (phase === "running") {
    return "active";
  }
  if (phase === "graded") {
    return stage.id === "grade" && verdict === "fail" ? "fail" : "done";
  }
  return stage.control ? "active" : "neutral";
}

export function buildPipelineGraph({
  mode,
  phase,
  verdict = null,
  focusedId = null,
}: {
  mode: RagExerciseMode;
  phase: RagFlowPhase;
  verdict?: Verdict | null;
  focusedId?: string | null;
}): { nodes: Node<RagFlowNodeData>[]; edges: Edge[] } {
  const stages = pipelineForMode(mode);
  const nodes: Node<RagFlowNodeData>[] = stages.map((stage, index) => {
    const state = stageState(stage, phase, verdict);
    return {
      id: stage.id,
      type: RAG_FLOW_NODE_TYPE,
      position: { x: index * STAGE_GAP, y: 72 },
      data: {
        title: stage.title,
        subtitle: stage.subtitle,
        state,
        badge:
          state === "done" ? "done" : phase === "idle" && stage.control ? "control" : undefined,
        focused: stage.id === focusedId,
        icon: ragFlowIcon(stage.icon),
        iconAccent: ragFlowIconAccent(stage.icon),
      },
    };
  });
  const lit = phase !== "idle";
  const edges: Edge[] = stages.slice(1).map((stage, index) => ({
    id: `${stages[index].id}-${stage.id}`,
    source: stages[index].id,
    target: stage.id,
    type: RAG_FLOW_NODE_TYPE,
    animated: phase === "running",
    style: {
      stroke: lit ? LIT : DIM,
      strokeWidth: lit ? 2 : 1,
      strokeDasharray: lit ? undefined : "5 4",
    },
  }));
  return { nodes, edges };
}
