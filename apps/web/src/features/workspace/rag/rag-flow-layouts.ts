import type { Edge, Node } from "@xyflow/react";
import {
  ragFlowIcon,
  ragFlowIconAccent,
  type RagFlowNodeData,
} from "./rag-flow-node";
import type { RagExerciseMode } from "./rag-flow-steps";

export type RagFlowLayout = {
  nodes: Node<RagFlowNodeData>[];
  edges: Edge[];
  /** Graph node ids in execution order for edge lighting */
  pathOrder: string[];
  /** Step ids used while submit is pending */
  runPulseSteps: Array<
    "retrieve" | "stores" | "evaluate" | "context" | "generate" | "grade"
  >;
};

function node(
  id: string,
  x: number,
  y: number,
  title: string,
  subtitle: string,
  icon: Parameters<typeof ragFlowIcon>[0],
): Node<RagFlowNodeData> {
  return {
    id,
    type: "ragFlow",
    position: { x, y },
    data: {
      title,
      subtitle,
      state: "neutral",
      icon: ragFlowIcon(icon),
      iconAccent: ragFlowIconAccent(icon),
    },
  };
}

function edge(
  id: string,
  source: string,
  target: string,
  opts?: { sourceHandle?: string; targetHandle?: string; label?: string },
): Edge {
  return {
    id,
    source,
    target,
    sourceHandle: opts?.sourceHandle,
    targetHandle: opts?.targetHandle,
    label: opts?.label,
    labelStyle: opts?.label
      ? { fill: "var(--lp-muted)", fontSize: 10, fontWeight: 600 }
      : undefined,
    labelBgStyle: opts?.label ? { fill: "transparent" } : undefined,
    type: opts?.label ? "ragFlow" : undefined,
  };
}

/** R1 — chunking only; no generation in the harness path */
const CHUNK_LAYOUT: RagFlowLayout = {
  nodes: [
    node("query", 0, 72, "Query", "input", "query"),
    node("retriever", 128, 72, "Retriever", "you control", "retriever"),
    node("vdb", 256, 0, "Vector DB", "chunks", "vdb"),
    node("vsearch", 256, 72, "Vector", "search", "vsearch"),
    node("context", 384, 72, "Context", "assembly", "context"),
    node("grade", 512, 72, "Grade", "hidden set", "grade"),
  ],
  edges: [
    edge("query-retriever", "query", "retriever"),
    edge("retriever-vsearch", "retriever", "vsearch"),
    edge("vdb-vsearch", "vdb", "vsearch", { sourceHandle: "bottom", targetHandle: "top" }),
    edge("vsearch-context", "vsearch", "context"),
    edge("context-grade", "context", "grade"),
  ],
  pathOrder: ["query", "retriever", "vsearch", "context", "grade"],
  runPulseSteps: ["retrieve", "stores", "context", "grade"],
};

/** R2 — budget / top-k; token gate before grade */
const BUDGET_LAYOUT: RagFlowLayout = {
  nodes: [
    node("query", 0, 72, "Query", "input", "query"),
    node("retriever", 120, 72, "Retriever", "top-k · chunks", "retriever"),
    node("vdb", 240, 0, "Vector DB", "chunks", "vdb"),
    node("vsearch", 240, 72, "Vector", "search", "vsearch"),
    node("evaluator", 360, 72, "Budget", "token gate", "evaluator"),
    node("context", 480, 72, "Context", "cap", "context"),
    node("grade", 600, 72, "Grade", "hidden set", "grade"),
  ],
  edges: [
    edge("query-retriever", "query", "retriever"),
    edge("retriever-vsearch", "retriever", "vsearch"),
    edge("vdb-vsearch", "vdb", "vsearch", { sourceHandle: "bottom", targetHandle: "top" }),
    edge("vsearch-evaluator", "vsearch", "evaluator"),
    edge("evaluator-context", "evaluator", "context"),
    edge("context-grade", "context", "grade"),
  ],
  pathOrder: ["query", "retriever", "vsearch", "evaluator", "context", "grade"],
  runPulseSteps: ["retrieve", "stores", "evaluate", "context", "grade"],
};

/** R3 — fixed retrieval; learner authors generation prompt */
const PROMPT_LAYOUT: RagFlowLayout = {
  nodes: [
    node("query", 0, 72, "Query", "input", "query"),
    node("retriever", 110, 72, "Retriever", "fixed", "retriever"),
    node("vsearch", 220, 72, "Vector", "search", "vsearch"),
    node("context", 330, 72, "Context", "assembly", "context"),
    node("llm", 440, 72, "LLM", "you control", "llm"),
    node("grade", 550, 72, "Grade", "citation gate", "grade"),
  ],
  edges: [
    edge("query-retriever", "query", "retriever"),
    edge("retriever-vsearch", "retriever", "vsearch"),
    edge("vsearch-context", "vsearch", "context"),
    edge("context-llm", "context", "llm"),
    edge("llm-grade", "llm", "grade"),
  ],
  pathOrder: ["query", "retriever", "vsearch", "context", "llm", "grade"],
  runPulseSteps: ["stores", "context", "generate", "grade"],
};

/** R4 — rerank / rewrite; metadata branch + eval loop preview */
const RERANK_LAYOUT: RagFlowLayout = {
  nodes: [
    node("query", 0, 88, "Query", "input", "query"),
    node("planner", 118, 88, "Planner", "agent", "planner"),
    node("retriever", 236, 88, "Retriever", "you control", "retriever"),
    node("vdb", 378, 0, "Vector DB", "chunks", "vdb"),
    node("vsearch", 378, 88, "Vector", "search", "vsearch"),
    node("evaluator", 496, 88, "Evaluator", "rerank", "evaluator"),
    node("context", 614, 88, "Context", "assembly", "context"),
    node("llm", 732, 88, "LLM", "generate", "llm"),
    node("grade", 850, 88, "Grade", "hidden set", "grade"),
    node("metadata", 378, 176, "Metadata", "query", "metadata"),
    node("metadb", 496, 176, "Meta DB", "filters", "metadb"),
  ],
  edges: [
    edge("query-planner", "query", "planner"),
    edge("query-retriever", "query", "retriever"),
    edge("retriever-vsearch", "retriever", "vsearch"),
    edge("vdb-vsearch", "vdb", "vsearch", { sourceHandle: "bottom", targetHandle: "top" }),
    edge("retriever-metadata", "retriever", "metadata", {
      sourceHandle: "bottom",
      targetHandle: "top",
    }),
    edge("metadata-metadb", "metadata", "metadb"),
    edge("vsearch-evaluator", "vsearch", "evaluator"),
    edge("evaluator-context", "evaluator", "context"),
    edge("context-llm", "context", "llm"),
    edge("llm-grade", "llm", "grade"),
    edge("replan", "evaluator", "planner", {
      sourceHandle: "bottom",
      targetHandle: "bottom",
      label: "re-plan loop",
    }),
  ],
  pathOrder: [
    "query",
    "retriever",
    "vsearch",
    "metadata",
    "metadb",
    "evaluator",
    "context",
    "llm",
    "grade",
  ],
  runPulseSteps: ["retrieve", "stores", "evaluate", "context", "generate", "grade"],
};

/** R9 — custom Python retriever; platform vector stack out of path */
const SANDBOX_LAYOUT: RagFlowLayout = {
  nodes: [
    node("query", 0, 88, "Query", "hidden set", "query"),
    node("retriever", 200, 88, "Your code", "Python", "retriever"),
    node("grade", 400, 88, "Grade", "recall@5", "grade"),
    node("vsearch", 200, 0, "Vector", "not used", "vsearch"),
    node("vdb", 320, 0, "Vector DB", "not used", "vdb"),
  ],
  edges: [
    edge("query-retriever", "query", "retriever"),
    edge("retriever-grade", "retriever", "grade"),
  ],
  pathOrder: ["query", "retriever", "grade"],
  runPulseSteps: ["retrieve", "grade"],
};

const LAYOUT_BY_MODE: Record<RagExerciseMode, RagFlowLayout> = {
  chunk: CHUNK_LAYOUT,
  budget: BUDGET_LAYOUT,
  prompt: PROMPT_LAYOUT,
  rerank: RERANK_LAYOUT,
  sandbox: SANDBOX_LAYOUT,
};

export function ragFlowLayoutForMode(mode: RagExerciseMode): RagFlowLayout {
  return LAYOUT_BY_MODE[mode];
}
